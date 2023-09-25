export class Recorder {
    limit;
    allRecords;
    ids = this.gen();
    timeInterval;
    act_media;
    act_chunk;
    act_stream;
    *gen() {
        let i = 0;
        while (true) {
            yield ++i;
        }
    }
    constructor(num) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => console.log('Successfully connected'))
            .catch(err => {
            throw new Error('Microphone not detected');
        });
        this.limit = num;
        this.act_media = null;
        this.act_stream = null;
        this.act_chunk = [];
        this.allRecords = [];
    }
    async start_record() {
        if (this.act_media || this.act_stream)
            return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.act_media = new MediaRecorder(stream);
        this.act_stream = stream;
        this.act_media.start();
        this.act_media.addEventListener('dataavailable', e => {
            this.act_chunk.push(e.data);
        });
    }
    stop_record(time_length, record_name, cb) {
        if (!this.act_stream || !this.act_media)
            return false;
        this.act_media.stop();
        for (let x of this.act_stream.getAudioTracks()) {
            x.stop();
        }
        this.act_media.addEventListener('stop', () => {
            const blob = new Blob(this.act_chunk, { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            this.act_stream = null;
            this.act_chunk = [];
            this.act_media = null;
            const id = this.ids.next().value;
            const [m, s] = time_length.split(':').map(x => parseInt(x.replace('0', '')));
            const name = record_name ? record_name.slice(0, 15) : `Voice ${id}`;
            const finalRecord = {
                audio: audio,
                url,
                name,
                length: time_length || "??:??",
                length_sec: m * 60 + s,
                id: id,
                RecordedInterval: {
                    interval: null,
                    interval_f: (record, cte) => {
                        if (record.RecordedInterval.c_sec >= 59) {
                            record.RecordedInterval.c_sec = -1;
                            ++record.RecordedInterval.c_min;
                        }
                        ++record.RecordedInterval.c_sec;
                        let s_sec = `0${record.RecordedInterval.c_sec}`.slice(-2);
                        let s_min = `0${record.RecordedInterval.c_min}`.slice(-2);
                        cte.textContent = `${s_min}:${s_sec}`;
                    },
                    c_min: 0,
                    c_sec: 0,
                    active: false
                }
            };
            this.allRecords.push(finalRecord);
            cb(finalRecord);
        });
        return true;
    }
    startAndPause(record, button, countTimeElement) {
        if (record.audio.paused) {
            record.audio.play();
            button.className = 'fa fa-pause';
            if (countTimeElement) {
                record.RecordedInterval.active = true;
                record.RecordedInterval.interval = setInterval(() => record.RecordedInterval.interval_f(record, countTimeElement), 1000);
            }
            return;
        }
        if (countTimeElement) {
            clearInterval(record.RecordedInterval.interval);
            record.RecordedInterval.active = false;
        }
        record.audio.pause();
        button.className = 'fa fa-play';
    }
    deleteRecord(rec) {
        const ind = this.allRecords.indexOf(rec);
        if (!(ind >= 0 && ind < this.allRecords.length)) {
            return false;
        }
        if (!rec.audio.paused) {
            rec.audio.pause();
            rec.audio.currentTime = 0;
        }
        this.allRecords.splice(ind, 1);
        return true;
    }
    returnNewRecord(rec) {
        const a = document.createElement('article');
        const i_p = document.createElement('i');
        const i_d = document.createElement('i');
        const i_dwn = document.createElement('i');
        const p = document.createElement('p');
        const d = document.createElement('div');
        const s1 = document.createElement('span');
        const s2 = document.createElement('span');
        const tsc = document.createElement('section');
        const tsi = document.createElement('i');
        const ts = document.createElement('span');
        ts.appendChild(document.createTextNode(`${rec.length_sec.toString()}s`));
        tsc.className = 'secs';
        tsi.className = 'fa fa-clock';
        tsc.appendChild(ts);
        tsc.appendChild(tsi);
        const s = document.createElement('section');
        i_p.className = 'fa fa-play';
        i_d.className = 'fa fa-trash';
        i_dwn.className = 'fa fa-download';
        p.appendChild(document.createTextNode(rec.name));
        s1.appendChild(document.createTextNode('00:00'));
        s2.appendChild(document.createTextNode(rec.length));
        s.appendChild(s1);
        s.appendChild(document.createTextNode('/'));
        s.appendChild(s2);
        d.appendChild(s);
        d.appendChild(i_d);
        d.append(i_dwn);
        a.appendChild(i_p);
        a.appendChild(p);
        a.appendChild(d);
        a.appendChild(tsc);
        i_dwn.addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = rec.url;
            a.download = `${rec.name}.mp3`;
            a.click();
        });
        rec.audio.addEventListener('ended', () => {
            i_p.className = 'fa fa-play';
            clearInterval(rec.RecordedInterval.interval);
            rec.RecordedInterval.active = false;
            rec.RecordedInterval.c_min = 0;
            rec.RecordedInterval.c_sec = 0;
            rec.RecordedInterval.interval = null;
        });
        return a;
    }
    startRecTimer(min_cont, sec_cont) {
        let min = 0;
        let sec = 0;
        this.timeInterval = setInterval(() => {
            if (sec >= 59) {
                sec = -1;
                ++min;
                min_cont.textContent = `${('0' + min).slice(-2)}`;
            }
            ++sec;
            sec_cont.textContent = `${('0' + sec).slice(-2)}`;
        }, 1000);
    }
    stopRecTimer(min_cont, sec_cont) {
        clearInterval(this.timeInterval);
        const time = `${min_cont.textContent}:${sec_cont.textContent}`;
        min_cont.textContent = '00';
        sec_cont.textContent = '00';
        return time;
    }
    limitReached() {
        return this.allRecords.length >= this.limit;
    }
}
