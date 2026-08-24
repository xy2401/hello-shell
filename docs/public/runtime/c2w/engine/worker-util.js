var imagename;
var numchunks;
var preloadedWasmBuffer;

function serveIfInitMsg(msg) {
    const req_ = msg.data;
    if (typeof req_ === "object" && req_ !== null) {
        if (req_.type === "init") {
            if (req_.wasmBuffer) {
                preloadedWasmBuffer = req_.wasmBuffer;
            }
            if (req_.imagename) {
                imagename = req_.imagename;
            }
            if (req_.chunks) {
                numchunks = req_.chunks;
            }
            return true;
        }
    }
    return false;
}

function getImagename() {
    return imagename;
}

function fetchChunks(f) {
    if (preloadedWasmBuffer) {
        f(preloadedWasmBuffer);
        return;
    }
    var prefix = imagename;
    var chunks = numchunks || 0;
    var format = s => prefix + s + '.wasm';
    var files = [];
    for (var i = 0; i < chunks; i++) {
        var s = i.toString();
        while (s.length < 2) s = "0" + s;
        files[i] = s;
    }
    files = files.map(format);
    var list = [];
    files.forEach(file => list.push(fetch(file)));
    var results = [];
    Promise.all(list).then(resps => {
        resps.forEach(r => results.push(r.arrayBuffer()));
        Promise.all(results).then(ab => {
            var blob = new Blob(ab);
            blob.arrayBuffer().then(f);
        });
    }).catch(err => {
        console.error("fetchChunks failed:", err);
    });
}
