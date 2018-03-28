//the sound id is not correct for the main json

//https://scratch.mit.edu/internalapi/project/112151368/get/ url to het the project JSON
let costumes = [], sounds = [], status = 0;
function download_project (id = 211651365, return_value = false) {
    costumes = [];
    sounds = [];
    status = 0;
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            let zip = new JSZip(), return_array = [];

            console.log(xhttp.responseText);
            let json = JSON.parse(xhttp.responseText);
            console.log(json);
            //I only need yo get the coustumes and sounds that is in the satge and in the sprite children
            genenerate_sounds(json);
            //this is the order so the ids are correct for the svg and png images
            //pen layer
            costumes.push(json["penLayerMD5"]);
            json["penLayerID"] = 0;
            //all sprites
            json["children"].forEach((a, i) => { //all the sprites
                return_array = get_costumes(a, costumes);
                a = return_array[1];
                costumes = return_array[0]
            });
            return_array = get_costumes(json, costumes); //all the backdrops
            costumes = return_array[0];
            json = return_array[1];


            //updated way to deal with sounds that are in the json
            return_array = genenerate_sounds(json);
            json = return_array[0];
            sounds = return_array[1];

            let batch = [];
            costumes.forEach((a) => {
                batch.push(load_resource(a));
            });
            Promise.all(batch)
                .then((assets) => {
                assets.forEach((a) => {
                    if (a != null) {
                        zip.file(costumes.indexOf(a.name) + a.name.slice(a.name.indexOf("."), a.name.length), a.file, {binary: true});
                        console.log(costumes.indexOf(a.name) + a.name.slice(a.name.indexOf("."), a.name.length));
                    }

                });
                status++;
                if (status == 2) {
                    generateSB2(zip, json, id, return_value);
                }
            })
                .catch((e) => {
                console.warn(e);
            });

            batch = [];
            sounds.forEach((a) => {
                batch.push(load_resource(a));
            });
            Promise.all(batch)
                .then((assets) => {
                assets.forEach((a) => {
                    if (a != null) {
                        zip.file(sounds.indexOf(a.name) + a.name.slice(a.name.indexOf("."), a.name.length), a.file, {binary: true});
                        console.log(sounds.indexOf(a.name) + a.name.slice(a.name.indexOf("."), a.name.length));
                    }
                });  
                status++;
                if (status == 2) {
                    generateSB2(zip, json, id, return_value);
                }
            })
                .catch((e) => {
                console.warn(e);
            });
        }
    }
    xhttp.open("GET", "https://projects.scratch.mit.edu/internalapi/project/"+id+"/get/?format=json", true);
    xhttp.send();
}

function get_costumes (json, array) {
    let total_sprites = array;
    if (json.hasOwnProperty("costumes")) {
        //go through each layer a sprite has and get the id and layer
        json["costumes"].forEach((a, i) => {
            if (total_sprites.includes(a["baseLayerMD5"]) == false) {
                total_sprites.push(a["baseLayerMD5"]);
            }
        });
        //go through each layer and set its id
        json["costumes"].forEach((a, i) => {
            a["baseLayerID"] = total_sprites.indexOf(a["baseLayerMD5"]);
        });
    }
    return [total_sprites, json];
}

function load_resource (name) {
    return new Promise ((resolve, reject) => {
        JSZipUtils.getBinaryContent("https://cdn.assets.scratch.mit.edu/internalapi/asset/"+name+"/get/", (err, data) => {
            if(err) {
                resolve(null);
            } else {
                resolve({
                    name: name,
                    file: data
                });
            }
        });
    });
}

function load_project_info (id) {
    return new Promise ((resolve, reject) => {
        resolve("TempNameUntilThereIsALinkToGetProjectNameByOnlyId" + ".sb2");
        /*
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = () => {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                //let json = JSON.parse(xhttp.responseText);
                //resolve(json.title + ".sb2");

            }
        }
        xhttp.onerror = () => {
            resolve("Untitled.sb2");
        }
        xhttp.open("GET", "https://scratch.mit.edu/projects/"+id, true);
        xhttp.send();*/
    }); 
}

function genenerate_sounds (json) { //take in pure json
    let sound_list = [];
    json["children"].forEach((a, i) => { //then going to go through each child element
        if (a.hasOwnProperty("sounds")) {
            a["sounds"].forEach((a1, i1) => { //go through sounds of each child element
                if (sound_list.indexOf(a1["md5"]) == -1) {
                    sound_list.push(a1["md5"]);
                }
                //set the id of that element
                json["children"][i]["sounds"][i1]["soundID"] = sound_list.indexOf(a1["md5"]);
            });
        }
    });
    //then going to go through the sounds of the stage
    if (json.hasOwnProperty("sounds")) {
        json["sounds"].forEach((a, i) => {
            if (sound_list.indexOf(a["md5"]) == -1) {
                sound_list.push(a["md5"]);
            }
            //set the id of that element
            console.log(sound_list.indexOf(a["md5"]));
            json["sounds"][i]["soundID"] = sound_list.indexOf(a["md5"]);
        });
    }
    return [json, sound_list];
}

function generateSB2 (zip, json, id, return_value) {
    //turn json into a string
    zip.file("project.json", JSON.stringify(json));

    //generate final file
    let sb2 = zip.generate({type:"blob"});

    load_project_info(id)
        .then((a) => {
        if (return_value == false) {
            save(sb2, a);
        } else {
            _generate_offline(sb2);
        }
    });
}

function save (file, name) {
    let a = document.createElement("a");
    a.setAttribute("download", name);
    a.setAttribute("href", window.URL.createObjectURL(file));
    document.body.appendChild(a);
    a.addEventListener("click", () => {
        document.body.removeChild(a);
    });
    a.click();
}

function generate_offline (id) {
    download_project(id, true);
}

function _generate_offline (sb2) {
    let zip = new JSZip();
    var reader = new FileReader();
    reader.readAsBinaryString(sb2);
    zip.file("project.sb2", reader.result, {binary: true});

    let filestoload = [
        {
            url: "/player.css",
            name: "player.css"
        }, 
        {
            url: "/embed.css",
            name: "embed.css"
        },
        {
            url: "/fonts.js",
            name: "fonts.js"
        },
        {
            url: "/phosphorus.js",
            name: "phosphorus.js"
        },
        {
            url: "/player.js",
            name: "player.js"
        },
        {
            url: "/embeded.html",
            name: "embeded.html"
        },
        {
            url: "/icons.svg",
            name: "icons.svg"
        }
    ];
    let batch = [];
    filestoload.forEach((a) => {
        batch.push(load_files(a));
    });
    
    let status = 0;
    Promise.all(batch)
        .then((a) => {
        zip.file(a[1], a[0]);
        console.log("loaded");
        status ++;
        console.log(status);
        if (status == filestoload.length) {
            console.log(zip);
            let final = zip.generate({type:"blob"});
            save(final, "project");
        }
    });
}

function load_files (file) {
    new Promise((resolve, reject) => {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = () => {
            if (xhttp.status == 200 && xhttp.readyState == 4) {
                resolve([xhttp.response, file.name]);
            }
        };
        xhttp.onabort = () => {
            reject("abort");
        };
        xhttp.onerror = (e) => {
            reject(e);
        };
        xhttp.open("GET", file.url, true);
        xhttp.responseType = "blob";
        xhttp.send();
    });
}