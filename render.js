const $ = e => document.getElementById(e);

// Elements
const fIn = $('fInput');
const vid = $('vid');
const cvs = $('cvs');
const ctx = cvs.getContext('2d', { alpha: false });
const vpt = $('viewport');
const vtx = vpt.getContext('2d', { alpha: false });
const pSlider = $('pSlider');
const eTime = $('elapsedTime');
const vidID = $('vidID');

$('pBtn').onclick = () => fIn.click();

// Constants
const CHAR_WIDTH = 7.23; // px -> 8.44
const CHAR_HEIGHT = 15; // px -> 18
const DENSITY = [
    ' ', ' ', '.', ':', '!', '+', '*', 'e', '$', '@', '8',
    '.', '*', 'e', 's', '◍',
    '░', '▒', '▓', '█'
];

let cWidth = 0;
let cHeight = 0;

let hideMouseTimeout = null;

document.onmousemove = () => {
    if (hideMouseTimeout) {
        clearTimeout(hideMouseTimeout);
        hideMouseTimeout = null;
    }
    document.body.classList.add('active');
    hideMouseTimeout = setTimeout(() => {
        document.body.classList.remove('active');
    }, 5000);
}

document.onmouseleave = () => {
    if (hideMouseTimeout) {
        clearTimeout(hideMouseTimeout);
        hideMouseTimeout = null;
    }
    document.body.classList.remove('active');
}

pSlider.oninput = () => {
    vid.currentTime = pSlider.value * vid.duration;
    // render();
}

const render = () => {
    ctx.drawImage(vid, 0, 0, vid.videoWidth, vid.videoHeight, 0, 0, cWidth, cHeight); // Copy current frame of video to buffer canvas

    vtx.clearRect(0, 0, vtx.canvas.width, vtx.canvas.height); // Clear canvas

    for (let y = 0; y < cHeight; y++) {
        for (let x = 0; x < cWidth; x++) {
            /* Legacy drawing method
            const d = ctx.getImageData(x, y, 1, 1);
            const el = vpt.childNodes[((cWidth + 1) * y) + x];
            if (!el) continue;
            el.textContent = DENSITY[Math.round((d.data[0] + d.data[1] + d.data[2]) / 40.26)];
            el.style.color = `rgb(${d.data[0]},${d.data[1]},${d.data[2]})`;
             */
            const d = ctx.getImageData(x, y, 1, 1);
            vtx.fillStyle = `rgb(${d.data[0]},${d.data[1]},${d.data[2]})`;
            vtx.fillText(DENSITY[Math.round((d.data[0] + d.data[1] + d.data[2]) / 40.26)], x * CHAR_WIDTH, y * CHAR_HEIGHT);
        }
    }

    // vpt.innerHTML = domStr;

    const s = vid.currentTime % 60;
    const m = (vid.currentTime - s) / 60
    eTime.textContent = `${Math.floor(m).toString().padStart(2, '0')}:${Math.floor(s).toString().padStart(2, '0')}`;
    pSlider.value = vid.currentTime / vid.duration;
}

const calcCvSize = () => {
    cWidth = Math.floor(window.innerWidth / CHAR_WIDTH);
    cHeight = Math.floor(window.innerHeight / CHAR_HEIGHT);

    cvs.width = cWidth;
    cvs.height = cHeight;

    vpt.width = (cWidth * CHAR_WIDTH) - 1;
    vpt.height = (cHeight * CHAR_HEIGHT) - 1;
    vtx.font = '12px "MesloLGS NF", "Courier New", monospace'; // Font gets reset when canvas is resized

    render();

    /*vpt.textContent = '';
    for (let y = 0; y < cHeight; y++) {
        for (let x = 0; x < cWidth; x++) {
            const e = document.createElement('span');
            e.textContent = ' ';
            vpt.appendChild(e);
        }
        vpt.appendChild(document.createElement('br'));
    }*/
}

window.onresize = calcCvSize;
calcCvSize();

vid.onloadedmetadata = () => {
    const s = vid.duration % 60;
    const m = (vid.duration - s) / 60
    $('totalTime').textContent = `${Math.floor(m).toString().padStart(2, '0')}:${Math.floor(s).toString().padStart(2, '0')}`;
}

vid.onplay = () => {
    $('player').style.display = 'block';
    function step() {
        if (!(vid.currentTime >= 0 && !vid.paused && !vid.ended)) return;
        render();
        requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

fIn.onchange = e => {
    $('prompt').style.display = 'none';
    vid.src = URL.createObjectURL(e.target.files[0]);
    vid.play();
    $('title').textContent = 'Local file - ' + e.target.files[0].name;
}

$('rew').onclick = () => {
    vid.currentTime = vid.currentTime - 2;
}
$('ffw').onclick = () => {
    vid.currentTime = vid.currentTime + 2;
}

$('ppw').onclick = () => {
    const icon = document.querySelector('#ppw > img');
    if (vid.paused) {
        vid.play();
        icon.src = 'img/pause_white_24dp.svg';
    }
    else {
        vid.pause();
        icon.src = 'img/play_arrow_white_24dp.svg';
    }
}

vidID.onkeyup = e => {
    if ((e.key === 'Enter' || e.keyCode === 13) && vidID.checkValidity()) {
        const data = new FormData();
        data.append( 'q', e.target.value);

        e.target.disabled = true;

        (async () => {
            const resp = await fetch('https://cors.bridged.cc/https://yt1s.com/api/ajaxSearch/index',
                {
                    method: 'POST',
                    body: data
                });
            const d = await resp.json();
            console.log(d);
            if (d.p !== 'convert') {
                e.target.disabled = false;
                return;
            }
            $('title').textContent = 'YouTube - ' + d.title;

            const cData = new FormData();
            cData.append( 'vid', d.vid);
            cData.append('k', d.links.mp4.auto.k);
            const convResp = await fetch('https://cors.bridged.cc/https://yt1s.com/api/ajaxConvert/convert',
                {
                    method: 'POST',
                    body: cData
                });
            const convD = await convResp.json();
            //vid.setAttribute('crossOrigin', '');

            //const vidResp = await fetch('https://cors.bridged.cc/' + convD.dlink, {
            //    method: 'GET'
           // })
            //vid.src = URL.createObjectURL(await vidResp.blob());
            vid.src = convD.dlink
            vid.play();
            $('prompt').style.display = 'none';
        })();
    }
}
