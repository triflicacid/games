import { clamp } from "./util.js";

/** Class containing static control functions for the Sound objects */
export class Sounds {
  /** Stop all registered sounds */
  static stop() {
    for (const sound in Sounds.sounds) {
      if (Sounds.sounds.hasOwnProperty(sound)) {
        Sounds.sounds[sound].stop();
      }
    }
  }
  /**
   * Get a sound according to its created name
   * - Only available if created via static method `Sounds.Create(...)`, and not via `new Sound(...)`
   * @param name    Associated name of sound
   */
  static get(name) {
    return Sounds.sounds[name];
  }
  /**
   * Get a sound using Sounds.Get, clone and play it
   * - Cloning allows multiple of this sound to play simultaneously
   * @param name    Associated name of sound
   * @return Sound played?
   */
  static play(name) {
    if (!Sounds.isEnabled) return false;
    const sound = Sounds.get(name);
    if (sound) {
      const obj = sound.clone();
      obj.play();
      return true;
    }
    else {
      return false;
    }
  }
  /**
   * Create a new Sound object
   * @param  name    Name of sound
   * @param  path    Path to sound file
   * @param  loadNow    Fetch sound data from file now?
   */
  static async create(name, path, loadNow = true) {
    if (Sounds.sounds[name] == undefined) {
      Sounds.sounds[name] = new Sound(path);
      if (loadNow) {
        return await Sounds.sounds[name].load();
      }
      else {
        return void 0;
      }
    }
    else {
      throw new Error(`Key '${name}' already exists`);
    }
  }
  /**
   * Say something using Speech Utterance
   * @param speech   What to say
   * @param lang     Language of voice
   * @default lang = "en-Gb"
   */
  static say(speech, lang = 'en-GB') {
    if (Sounds.isEnabled) {
      let msg = new SpeechSynthesisUtterance();
      msg.lang = lang;
      msg.text = speech;
      window.speechSynthesis.speak(msg);
    }
  }
  /**
   * Enable sound to be played
   */
  static enable() {
    Sounds.isEnabled = true;
  }
  /**
   * Disable sound from being played
   * - Pause all active sounds
   */
  static disable() {
    Sounds.isEnabled = false;
    for (const sound in Sounds.sounds) {
      if (Sounds.sounds.hasOwnProperty(sound)) {
        Sounds.sounds[sound].pause();
      }
    }
  }
}
/** Object of created Sound objects */
Sounds.sounds = {};
/** Is the playing of sounds currently enabled? */
Sounds.isEnabled = true;
/**
 * Contains an indivdual track or sound
 */
export class Sound {
  /**
   * @param path     Path to sound file
   * @param fetch   Fetch sound data immediatly?
   */
  constructor(path, fetch = true) {
    this.activeAudio = null; // Active sound node
    this._loop = false; // Loop the sound?
    this.isPlaying = false;
    this.pausedAt = NaN; // When paused, what time did we pause at?
    this._volume = 1;
    this.path = path;
    this._loadInternal();
    if (fetch)
      this.load();
  }
  /** Copy sound object */
  clone() {
    const obj = new Sound(this.path, false);
    obj.buffer = this.buffer;
    return obj;
  }
  /** Setup internal resources */
  _loadInternal() {
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
    this.gainNode.gain.value = this._volume;
  }
  /**
   * Load audio data from this.path
   */
  async load() {
    // Get URL
    const response = await fetch(this.path);
    // Get raw binary data
    const arraybuffer = await response.arrayBuffer();
    // Decode to audio buffer
    const audioBuffer = await this.ctx.decodeAudioData(arraybuffer);
    this.buffer = audioBuffer;
    return this;
  }
  /**
   * Create audio buffer from array buffer
   */
  async loadArrayBuffer(buf) {
    this.buffer = await this.ctx.decodeAudioData(buf);
    return this.buffer;
  }
  /**
   * Play sound from a buffer
   * @returns success?
   */
  play() {
    return new Promise(async (resolve, reject) => {
      if (!Sounds.isEnabled || this.isPlaying) {
        resolve(false);
        return;
      }
      // If buffer does not exit, create it
      if (this.buffer == undefined)
        await this.load();
      // Create source buffer
      let source = this.ctx.createBufferSource();
      source.buffer = this.buffer;
      // Create filter for buffer
      let filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 5000; // Default frequency
      // Connect source to things needed to play sound
      source.connect(this.gainNode);
      source.connect(filter);
      // Event handlers for finishing
      source.onended = () => {
        if (source.stop)
          source.stop();
        if (source.disconnect)
          source.disconnect();
        this.isPlaying = false;
        this.activeAudio = null; // Remove from audio array
        resolve(true);
      };
      // Play buffer from time = 0s
      source.loop = this._loop;
      this.activeAudio = source;
      if (isNaN(this.pausedAt)) {
        // Start from beginning
        source.start(0);
      }
      else {
        // Start from stored time
        let time = this.pausedAt - 0.7;
        if (time < 0)
          time = 0;
        source.start(0, time);
        this.pausedAt = NaN;
      }
      this.isPlaying = true;
    });
  }
  /**
  * Get/Set volume of sound
  * @param volume 0..1
  */
  volume(volume) {
    if (volume !== undefined) {
      volume = clamp(volume, 0, 1);
      this._volume = volume;
      this.gainNode.gain.value = volume;
    }
    return this._volume;
  }
  /**
   * Get/Set - Should we loop the sound?
   */
  loop(value) {
    if (value !== undefined) {
      this._loop = value;
      if (this.activeAudio)
        this.activeAudio.loop = value;
    }
    return this._loop;
  }
  /**
   * Pause the sound
   */
  pause() {
    if (this.isPlaying && this.activeAudio) {
      this.pausedAt = this.ctx.currentTime;
      this.stop();
    }
  }
  /**
   * Stop any sound
   * @async
   */
  async stop() {
    // Close current audio context
    await this.ctx.close();
    this.isPlaying = false;
    this.activeAudio = null;
    // Create new stuff
    this._loadInternal();
  }
}
/**
 * Create a beeping noise
 */
export class Beep {
  constructor() {
    this._volume = 1;
    this._frequency = 500;
    this._type = "square";
    this._playing = false;
    // Initiate
    this._ctx = new AudioContext();
    this._gain = this._ctx.createGain();
    this._gain.connect(this._ctx.destination);
    this._oscillator = this._ctx.createOscillator();
    this.createNew();
  }
  /**
   * Create a new oscillator
   */
  createNew() {
    if (this._playing)
      throw new Error(`Cannot create new oscillator whilst one is playing`);
    this._oscillator = this._ctx.createOscillator();
    this._oscillator.frequency.value = this._frequency;
    this._oscillator.type = this._type;
    this._oscillator.connect(this._gain);
    this._gain.gain.value = this._volume;
    return this;
  }
  /**
   * Get or set volume of beep. Percentage;
   * @param volume Percentage to set to (percentage), or blank to get
   */
  volume(volume) {
    if (volume !== undefined) {
      volume = clamp(volume, 0, 100);
      this._volume = volume / 100;
      this.update();
    }
    return this._volume * 100;
  }
  /**
   * Get or set frequency of beep.
   * @param freq Frequency to set oscillator to, or blank to get
   */
  frequency(freq) {
    if (typeof freq === "number") {
      freq = clamp(freq, 0, 24000);
      this._frequency = freq;
      this.update();
    }
    return this._frequency;
  }
  /**
   * Get or set type of oscillator.
   * @param form   Wave form to set oscillator to, or blank to get
   */
  form(form) {
    if (form !== undefined) {
      this._type = form;
      this.update();
    }
    return this._type;
  }
  /**
   * Start the oscillator. Returns Promise if duration is not infinite.
   * @param duration Duration of the beep (ms) (default=Infinity)
   * @return {Boolean} Was successfull ?
   */
  start(duration = Infinity) {
    if (this._playing)
      return false;
    this.createNew(); // Create new oscillator
    this._oscillator.start(this._ctx.currentTime);
    this._playing = true;
    if (typeof duration == 'number' && !isNaN(duration) && isFinite(duration)) {
      return new Promise((resolve, reject) => {
        this._startReject = reject;
        setTimeout(() => {
          this._startReject = undefined;
          this.stop();
          resolve(this);
        }, duration);
      });
    }
    return true;
  }
  /**
   * Update the oscillator with the current frequency and volume and wave form
   * @return {Boolean} true or return value of this.start()
   */
  update() {
    const playing = this._playing;
    if (playing)
      this.stop();
    this.createNew();
    this._oscillator.frequency.value = this._frequency;
    this._oscillator.type = this._type;
    this._gain.gain.value = this._volume;
    if (playing)
      return this.start();
    return true;
  }
  /**
   * Stop the oscillator. If this.start() call returned a Promise, reject this promise.
   * @return {Boolean} Was successfull?
   */
  stop() {
    if (!this._playing)
      return false;
    this._oscillator.stop();
    this._playing = false;
    if (this._startReject) {
      this._startReject(new Error('STOP'));
      this._startReject = undefined;
    }
    return true;
  }
}