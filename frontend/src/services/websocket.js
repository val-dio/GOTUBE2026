const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:5000');

class WSService {
  constructor() {
    this.ws        = null;
    this.listeners = {}; // jobId → callback
    this.connected = false;
    this.queue     = [];  // messages to send once connected
  }

  connect() {
    if (this.ws && this.ws.readyState <= 1) return;

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.connected = true;
      this.queue.forEach(msg => this.ws.send(msg));
      this.queue = [];
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const cb = this.listeners[data.jobId];
        if (cb) cb(data);
        // broadcast to '*' listeners (global)
        if (this.listeners['*']) this.listeners['*'](data);
      } catch (_) {}
    };

    this.ws.onclose = () => {
      this.connected = false;
      // auto-reconnect after 3s if there are active listeners
      if (Object.keys(this.listeners).length > 0) {
        setTimeout(() => this.connect(), 3000);
      }
    };

    this.ws.onerror = () => this.ws.close();
  }

  subscribe(jobId, callback) {
    this.listeners[jobId] = callback;
    this.connect();
    return () => { delete this.listeners[jobId]; };
  }

  send(payload) {
    const msg = JSON.stringify(payload);
    if (this.connected) {
      this.ws.send(msg);
    } else {
      this.queue.push(msg);
      this.connect();
    }
  }

  disconnect() {
    this.listeners = {};
    this.queue = [];
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.connected = false;
  }
}

export default new WSService();
