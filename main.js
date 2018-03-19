//https://scratch.mit.edu/internalapi/project/112151368/get/ url to het the project JSON
let costumes = [], sounds = [], status = 0;
function download_project (id = 208512075) {
    costumes = [];
    sounds = [];
    status = 0;
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            let zip = new JSZip(), return_array = [];

            console.log(xhttp.responseText);
            json = JSON.parse(xhttp.responseText);
            console.log(json);
            //I only need yo get the coustumes and sounds that is in the satge and in the sprite children

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


            //sounds for sprites and stage
            json["children"].forEach((a, i) => {
                return_array = get_sounds(a, sounds);
                sounds = return_array[0];
                a = return_array[1];
            });
            return_array = get_sounds(json, sounds);
            sounds = return_array[0];
            json = return_array[1];

            let batch = [];
            costumes.forEach((a) => {
                batch.push(load_resource(a));
            });
            Promise.all(batch)
                .then((assets) => {
                assets.forEach((a) => {
                    zip.file(costumes.indexOf(a.name) + a.name.slice(a.name.indexOf("."), a.name.length), a.file, {binary: true});
                    console.log(costumes.indexOf(a.name) + a.name.slice(a.name.indexOf("."), a.name.length));
                });
                status++;
                if (status == 2) {
                    generateSB2(zip, json, id);
                }
            });

            batch = [];
            sounds.forEach((a) => {
                batch.push(load_resource(a));
            });
            Promise.all(batch)
                .then((assets) => {
                assets.forEach((a) => {
                    zip.file(sounds.indexOf(a.name) + a.name.slice(a.name.indexOf("."), a.name.length), a.file, {binary: true});
                    console.log(sounds.indexOf(a.name) + a.name.slice(a.name.indexOf("."), a.name.length));
                });
                status++;
                if (status == 2) {
                    generateSB2(zip, json, id);
                }
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

function get_sounds (json, array) {
    let total_sounds = array;
    if (json.hasOwnProperty("sounds")) {
        //go through each layer a sprite has and get the id and layer
        json["sounds"].forEach((a, i) => {
            if (total_sounds.includes(a["md5"]) == false) {
                total_sounds.push(a["md5"]);
            }
        });

        json["sounds"].forEach((a, i) => {
            json["soundID"] = total_sounds.indexOf(a["md5"]);
        });
    }
    return [total_sounds, json];
}

function load_resource (name) {
    return new Promise ((resolve, reject) => {
        JSZipUtils.getBinaryContent("https://cdn.assets.scratch.mit.edu/internalapi/asset/"+name+"/get/", (err, data) => {
            if(err) {
                reject(err);
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
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = () => {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                let json = JSON.parse(xhttp.responseText);
                resolve(json.title + ".sb2");
            }
        }
        xhttp.onerror = () => {
            resolve("Untitled.sb2");
        }
        xhttp.open("GET", "https://scratch.mit.edu/api/v1/project/"+id+"/?format=json",true);
        xhttp.send();
    }); 
}

function generateSB2 (zip, json, id) {
    //turn json into a string
    zip.file("project.json", JSON.stringify(json));

    //generate final file
    let sb2 = zip.generate({type:"blob"});

    load_project_info(id)
        .then((a) => {
        save(sb2, a);
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