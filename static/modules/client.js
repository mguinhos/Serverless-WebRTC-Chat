class Client {
    constructor() {
        this.onmessage = null;

        /** @type {RTCPeerConnection} */
        this.connection = new RTCPeerConnection();

        /** @type {RTCDataChannel} */
        this.channel = null;
    }

    /** @returns {Promise<RTCSessionDescription>} */
    async serve() {
        /** @type {Promise<RTCSessionDescription>} */
        let my_offer = new Promise(
            async resolve => {
                this.connection.onicecandidate = async ice => {
                    if (ice.candidate == null) {
                        return await resolve(this.connection.localDescription)
                    }
                };

                this.channel = this.connection.createDataChannel('message');
                this.channel.onopen = e => {
                    console.log('server channel open', e);
                }
                this.channel.onmessage = e => {
                    this.onmessage(e);
                }

                let my_offer = await this.connection.createOffer();
                await this.connection.setLocalDescription(my_offer);
            }
        );

        return await my_offer;
    }

    /**
     * @param {RTCSessionDescription} offer
     * @returns {Promise<RTCSessionDescription>}
     */
    async connect(their_offer) {
        /** @type {Promise<RTCSessionDescription>} */
        let my_answer = new Promise(
            async resolve => {
                this.connection.ondatachannel = e => {
                    let channel = e.channel || e;

                    this.channel = channel;
                    this.channel.onopen = e => {
                        console.log('client channel open', e);
                    }
                    this.channel.onmessage = e => {
                        this.onmessage(e);
                    }

                    this.channel.onopen();
                }

                this.connection.onicecandidate = async ice => {
                    if (ice.candidate == null) {
                        return await resolve(this.connection.localDescription);
                    }
                };

                await this.connection.setRemoteDescription(their_offer);
                
                if (their_offer.type == 'offer') {
                    let my_answer = await this.connection.createAnswer();
                    await this.connection.setLocalDescription(my_answer);
                }
            }
        );

        return await my_answer;
    }

    send(message) {
        return this.channel.send(message);
    }
}

export default Client;