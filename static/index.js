import Client from './modules/client';

let client = new Client();

/** @param {string} text */
function sanitizeXSS(text) {
    return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

const EMOJI_MAPPINGS = {
    thumbsup: '👍',
    flushed: '😳',
};

/** @param {string} text */
function markdown(text) {
    text = text.replaceAll(/## [a-zA-Z0-9]+\n/g,
        matched => `<h2>${sanitizeXSS(matched.slice(3, matched.length -1))}</h2>`
    );

    text = text.replaceAll(/# [a-zA-Z0-9]+\n/g,
        matched => `<h1>${sanitizeXSS(matched.slice(2, matched.length -1))}</h1>`
    );

    text = text.replaceAll('\n', '<br>');
    text = text.replaceAll(' ', '&nbsp;');

    text = text.replaceAll(/:color_[a-zA-Z0-9][_a-zA-Z0-9]*:[a-zA-Z0-9;.,<>(){}\[\] +\-*=\\]+/g,
        matched => {
            console.log('matched', matched);

            let attribute = matched.match(/:[a-zA-Z0-9][_a-zA-Z0-9]*:/)[0];
            let text_without_attribute = matched.slice(attribute.length, matched.length);

            let color = attribute.slice(':color_'.length, attribute.length -1);

            console.log('color', color);

            return `<font color="${color}">${sanitizeXSS(text_without_attribute)}</font>`;
        }
    );

    text = text.replaceAll(/:image_src_\[[_a-zA-Z0-9:;.,\\/&@=?!+\-*%$@]+\]:/g,
        matched => {
            console.log('matched', matched);
            
            let image_src = matched.slice(':image_src_['.length, matched.length -2);

            console.log(':image_src_[', image_src);

            return `<img src="${sanitizeXSS(image_src)}">`;
        }
    );

    for (let [emoji_name, emoji_value] of Object.entries(EMOJI_MAPPINGS)) {
        text = text.replaceAll(`:${emoji_name}:`, emoji_value);
    }

    return text;
}

client.onmessage = e => {
    /** @type {HTMLDivElement} */
    let messagesElement = document.getElementById('messages');

    messagesElement.innerHTML += `<p>${markdown(sanitizeXSS(e.data))}</p>`;

    console.log('received', e);
}


async function onSendClick(e) {
    /** @type {HTMLInputElement} */
    let messageElement = document.getElementById('message');

    /** @type {HTMLDivElement} */
    let messagesElement = document.getElementById('messages');

    messagesElement.innerHTML += `<p note>${markdown(sanitizeXSS(messageElement.value))}</p>`;

    console.log('send', client.send(messageElement.value));
}

async function onConnectClick(e) {
    /** @type {HTMLInputElement} */
    let inviteElement = document.getElementById('invite');
    
    let their_offer = new RTCSessionDescription(JSON.parse(atob(inviteElement.value)));
    let my_answer = await client.connect(their_offer);

    console.log('connect', my_answer);

    inviteElement.value = btoa(JSON.stringify(my_answer));

    alert('now copy the answer invite and paste back to its orgin and click connect');
}

async function onServeClick(e) {
    let my_offer = await client.serve();

    console.log('serve', my_offer);

    /** @type {HTMLInputElement} */
    let inviteElement = document.getElementById('invite');
    inviteElement.value = btoa(JSON.stringify(my_offer));

    alert('now copy the offer invite and paste on another client and click connect');
}

function onInput(e) {
    let currentTarget = e.currentTarget;

    console.log(currentTarget.id)

    let elementsToEnable = document.querySelectorAll(`[enabler="${currentTarget.id}"]`);

    if (currentTarget.value) {
        for (let elementToEnable of elementsToEnable) {
            elementToEnable.disabled = false;
        }
    }
    else {
        for (let elementToEnable of elementsToEnable) {
            elementToEnable.disabled = true;
        }
    }
}

window.onSendClick = onSendClick;
window.onConnectClick = onConnectClick;
window.onServeClick = onServeClick;
window.onInput = onInput;