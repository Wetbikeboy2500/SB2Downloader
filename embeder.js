function generate_offline (id) {
    download_project(id, true);
}

function _generate_offline (sb2) {
    let zip = new JSZip();

    let res = zip.folder("res");

    res.file("player.js", get_file(0));
    res.file("phosphorus.js", get_file(1));

    let final = zip.generate({type:"blob"});
    save(final, "project");
    /*let filestoload = [
        {
            url: "embeded.html",
            name: "embeded.html"
        },
        {
            url: "icons.svg",
            name: "icons.svg"
        }
    ];
    let batch = [];
    filestoload.forEach((a) => {
        batch.push(load_files(a));
    });

    let status = 0;
    Promise.all(batch)
        .then((i) => {
        i.forEach((a) => {
            console.log(a);
            zip.file(a.name, a.file);
            console.log("loaded");
            status ++;
            console.log(status);
            if (status == filestoload.length) {
                console.log(zip);
                let final = zip.generate({type:"blob"});
                save(final, "project");
            }
        });
    });*/
}

function load_files (file) {
    return new Promise((resolve, reject) => {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = () => {
            if (xhttp.status == 200 && xhttp.readyState == 4) {
                console.log(xhttp.response, file.name);
                resolve({ "file": xhttp.responseText, "name": file.name});
            }
        };
        xhttp.onabort = () => {
            reject("abort");
        };
        xhttp.onerror = (e) => {
            reject(e);
        };
        xhttp.open("GET", file.url, true);
        //xhttp.responseType = "blob";
        xhttp.send();
    });
}

function toArrayBuffer (a) {
    console.info(str2ab(a));
    document.getElementById("output").innerHTML = String(str2ab(a));
    console.log(get_file(0));
}

/*file manipulation*/
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}
function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}