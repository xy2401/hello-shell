importScripts("./workerTools.js");
importScripts("./browser_wasi_shim/index.js");
importScripts("./browser_wasi_shim/wasi_defs.js");
importScripts("./worker-util.js");
importScripts("./wasi-util.js");

onmessage = (msg) => {
    if (serveIfInitMsg(msg)) {
        return;
    }
    var ttyClient = new TtyClient(msg.data);
    var args = ['arg0'];
    var env = [
        'TERM=xterm-256color',
        'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        'HOME=/workspace',
        'USER=root'
    ];
    var fds = [
        undefined, // 0: stdin
        undefined, // 1: stdout
        undefined  // 2: stderr
    ];

    fetchChunks((wasm) => {
        startWasi(wasm, ttyClient, args, env, fds);
    });
};

function startWasi(wasm, ttyClient, args, env, fds) {
    var wasi = new WASI(args, env, fds);
    wasiHack(wasi, ttyClient);
    WebAssembly.instantiate(wasm, {
        "wasi_snapshot_preview1": wasi.wasiImport,
    }).then((inst) => {
        wasi.start(inst.instance);
    }).catch((err) => {
        console.error("WASI VM error:", err);
    });
}

// wasiHack patches wasi object for integrating it to xterm-pty.
function wasiHack(wasi, ttyClient) {
    const ERRNO_INVAL = 28;
    const ERRNO_AGAIN = 6;
    var _fd_read = wasi.wasiImport.fd_read;
    wasi.wasiImport.fd_read = (fd, iovs_ptr, iovs_len, nread_ptr) => {
        if (fd === 0) {
            var buffer = new DataView(wasi.inst.exports.memory.buffer);
            var buffer8 = new Uint8Array(wasi.inst.exports.memory.buffer);
            var iovecs = Iovec.read_bytes_array(buffer, iovs_ptr, iovs_len);
            var nread = 0;
            for (var i = 0; i < iovecs.length; i++) {
                var iovec = iovecs[i];
                if (iovec.buf_len === 0) {
                    continue;
                }
                var data = ttyClient.onRead(iovec.buf_len);
                buffer8.set(data, iovec.buf);
                nread += data.length;
            }
            buffer.setUint32(nread_ptr, nread, true);
            return 0;
        } else {
            return _fd_read.apply(wasi.wasiImport, [fd, iovs_ptr, iovs_len, nread_ptr]);
        }
    };

    var _fd_write = wasi.wasiImport.fd_write;
    wasi.wasiImport.fd_write = (fd, iovs_ptr, iovs_len, nwritten_ptr) => {
        if (fd === 1 || fd === 2) {
            var buffer = new DataView(wasi.inst.exports.memory.buffer);
            var buffer8 = new Uint8Array(wasi.inst.exports.memory.buffer);
            var iovecs = Ciovec.read_bytes_array(buffer, iovs_ptr, iovs_len);
            var wtotal = 0;
            for (var i = 0; i < iovecs.length; i++) {
                var iovec = iovecs[i];
                var buf = buffer8.slice(iovec.buf, iovec.buf + iovec.buf_len);
                if (buf.length === 0) {
                    continue;
                }
                ttyClient.onWrite(Array.from(buf));
                wtotal += buf.length;
            }
            buffer.setUint32(nwritten_ptr, wtotal, true);
            return 0;
        } else {
            return _fd_write.apply(wasi.wasiImport, [fd, iovs_ptr, iovs_len, nwritten_ptr]);
        }
    };

    wasi.wasiImport.poll_oneoff = (in_ptr, out_ptr, nsubscriptions, nevents_ptr) => {
        if (nsubscriptions === 0) {
            return ERRNO_INVAL;
        }
        let buffer = new DataView(wasi.inst.exports.memory.buffer);
        let in_ = Subscription.read_bytes_array(buffer, in_ptr, nsubscriptions);
        let isReadPollStdin = false;
        let isClockPoll = false;
        let pollSubStdin;
        let clockSub;
        let timeout = Number.MAX_VALUE;
        for (let sub of in_) {
            if (sub.u.tag.variant === "fd_read") {
                if (sub.u.data.fd === 0) {
                    isReadPollStdin = true;
                    pollSubStdin = sub;
                }
            } else if (sub.u.tag.variant === "clock") {
                if (sub.u.data.timeout < timeout) {
                    timeout = sub.u.data.timeout;
                    isClockPoll = true;
                    clockSub = sub;
                }
            }
        }
        let events = [];
        if (isReadPollStdin || isClockPoll) {
            var readable = false;
            if (isReadPollStdin || (isClockPoll && timeout > 0)) {
                readable = ttyClient.onWaitForReadable(timeout / 1000000000);
            }
            if (readable && isReadPollStdin) {
                let event = new Event();
                event.userdata = pollSubStdin.userdata;
                event.error = 0;
                event.type = new EventType("fd_read");
                events.push(event);
            }
            if (isClockPoll) {
                let event = new Event();
                event.userdata = clockSub.userdata;
                event.error = 0;
                event.type = new EventType("clock");
                events.push(event);
            }
        }
        var len = events.length;
        Event.write_bytes_array(buffer, out_ptr, events);
        buffer.setUint32(nevents_ptr, len, true);
        return 0;
    };
}
