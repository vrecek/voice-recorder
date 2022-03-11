interface Record {
   audio: HTMLAudioElement,
   name: string,
   length: string,
   length_sec: number
   id: number,
   RecordedInterval: {
      interval: any,
      interval_f: Function,
      c_min: number,
      c_sec: number,
      active: boolean
   }
}

export class Recorder {
   private limit:number
   private allRecords:Array<Record>
   private ids:any = this.gen()

   private timeInterval:number | undefined

   private act_media:MediaRecorder | null
   private act_chunk:Array<Blob>
   private act_stream:MediaStream | null



   private *gen(){
      let i = -1
      while(true){
         yield ++i
      }
   }



   public constructor(num:number){
      this.limit = num
      this.act_media = null
      this.act_stream = null
      this.act_chunk = []
      this.allRecords = []
   }

   public async start_record():Promise<void>{
      if(this.act_media || this.act_stream) return

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      this.act_media = new MediaRecorder(stream)
      this.act_stream = stream

      this.act_media.start()

      this.act_media.addEventListener('dataavailable', e => {
         this.act_chunk.push(e.data)
      })
   }

   public stop_record(time_length:string, record_name:string, cb:Function):boolean{
      if(!this.act_stream || !this.act_media) return false

      this.act_media.stop()

      for(let x of this.act_stream.getAudioTracks()){
         x.stop()
      }

      this.act_media.addEventListener('stop', () => {
         const blob = new Blob(this.act_chunk)
         const url = URL.createObjectURL(blob)
         const audio = new Audio(url)

         this.act_stream = null
         this.act_chunk = []
         this.act_media = null

         const id = this.ids.next().value
         const [m, s] = time_length.split(':').map(x => parseInt(x.replace('0', '')))
         let i = m * 60 + s
         const name = `Voice ${`00${id}`.slice(-3)}`
         const record_name_15 = record_name.slice(0, 15)

         const finalRecord = {
            audio: audio,
            name: record_name_15 || name,
            length: time_length || "??:??",
            length_sec: i,
            id: id,
            RecordedInterval: {
               interval: null,

               interval_f: (record:any,cte:any) => {
                  if(record.RecordedInterval.c_sec >= 59){
                     record.RecordedInterval.c_sec = -1
                     ++record.RecordedInterval.c_min
                  }
      
                  ++record.RecordedInterval.c_sec
      
                  let s_sec = `0${record.RecordedInterval.c_sec}`.slice(-2)
                  let s_min = `0${record.RecordedInterval.c_min}`.slice(-2)
      
                  cte.textContent = `${s_min}:${s_sec}`
               },

               c_min: 0,
               c_sec: 0,
               active: false
            }
         }

         this.allRecords.push(finalRecord)

         cb(finalRecord)     
      })

      return true
   }

   public startAndPause(record:Record, button:HTMLElement | Element, countTimeElement?:HTMLElement | Element):void{
      if(record.audio.paused){
         record.audio.play()
         button.className = 'fa fa-pause'

         if(countTimeElement){
            record.RecordedInterval.active = true
            record.RecordedInterval.interval = setInterval(() => record.RecordedInterval.interval_f(record, countTimeElement), 1000)
         }

         return
      }
      
      if(countTimeElement){
         clearInterval(record.RecordedInterval.interval)
         record.RecordedInterval.active = false
      }
      
      record.audio.pause()
      button.className = 'fa fa-play'
   }

   public deleteRecord(rec:Record):boolean{
      const ind = this.allRecords.indexOf(rec)

      if( !(ind >= 0 && ind < this.allRecords.length) ){
         return false
      }

      if(!rec.audio.paused){
         rec.audio.pause()
         rec.audio.currentTime = 0
      }

      ind >= 0 ? this.allRecords.splice(ind, 1) : null

      return true
   }

   public returnNewRecord(rec:Record):HTMLElement{
      const a = document.createElement('article')
      const i_p = document.createElement('i')
      const i_d = document.createElement('i')

      const p = document.createElement('p')

      const d = document.createElement('div')
      const s1 = document.createElement('span')
      const s2 = document.createElement('span')

      const s = document.createElement('section')

      i_p.className = 'fa fa-play'
      i_d.className = 'fa fa-trash'
      p.appendChild(document.createTextNode(rec.name))

      s1.appendChild(document.createTextNode('00:00'))
      s2.appendChild(document.createTextNode(rec.length))

      s.appendChild(s1)
      s.appendChild(document.createTextNode('/'))
      s.appendChild(s2)

      d.appendChild(s)
      d.appendChild(i_d)

      a.appendChild(i_p)
      a.appendChild(p)
      a.appendChild(d)
      
      rec.audio.addEventListener('ended', () => {
         i_p.className = 'fa fa-play'
         
         clearInterval(rec.RecordedInterval.interval)
         rec.RecordedInterval.active = false
         rec.RecordedInterval.c_min = 0
         rec.RecordedInterval.c_sec = 0
         rec.RecordedInterval.interval = null
      })

      return a
   }

   public startRecTimer(min_cont:HTMLElement, sec_cont:HTMLElement):void{
      let min = 0
      let sec = 0

      this.timeInterval = setInterval(() => {
         if(sec >= 59){
            sec = -1

            ++min
            min_cont.textContent = `${ ('0' + min).slice(-2) }`
         }

         ++sec
         sec_cont.textContent = `${ ('0' + sec).slice(-2) }`
      }, 1000)
   }

   public stopRecTimer(min_cont:HTMLElement, sec_cont:HTMLElement):string{
      clearInterval(this.timeInterval)

      const time = `${min_cont.textContent}:${sec_cont.textContent}`

      min_cont.textContent = '00'
      sec_cont.textContent = '00'

      return time
   }

   public limitReached():boolean{
      return this.allRecords.length >= this.limit
   }

}