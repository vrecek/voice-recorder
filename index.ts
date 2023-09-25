import { Record, Recorder } from "./Recorder.js"
const rec_button = document.querySelector('.rec') as HTMLElement
const stop_button = document.querySelector('.stop') as HTMLElement
const nameEle = document.querySelector('.name') as HTMLInputElement

const min = document.querySelector('.min') as HTMLElement
const sec = document.querySelector('.sec') as HTMLElement

const all = document.querySelector('.all') as HTMLElement

navigator.mediaDevices.getUserMedia({ audio: true })
.then(() => console.log('Successfully connected'))
.catch(err => {
   all.textContent = 'Microphone not detected'
})

const rec = new Recorder(5)

rec_button.addEventListener("click", async () => {
   if(rec.limitReached()) return

   rec_button.classList.toggle('disabled')
   stop_button.classList.toggle('disabled')

   rec.startRecTimer(min, sec)
   await rec.start_record()
})



stop_button.addEventListener("click", () => {
   rec_button.classList.toggle('disabled')
   stop_button.classList.toggle('disabled')

   const time = rec.stopRecTimer(min, sec)
   const name = nameEle.value || ''
   nameEle.value = ''

   rec.stop_record(time, name, (record:Record) => {
      const element = rec.returnNewRecord(record)

      const playBtn = element.children[0]
      const delBtn = element.children[2].children[1]
      const timeSpan = element.children[2].children[0].children[0]

      playBtn.addEventListener('click', () => {
         rec.startAndPause(record, playBtn, timeSpan)
      })

      delBtn.addEventListener('click', () => {
         delBtn.parentElement?.parentElement?.remove()
         rec.deleteRecord(record)
      })

      all.appendChild(element)
   })
})

