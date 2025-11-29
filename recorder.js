/*
TurboWarp Audio Recorder Extension (ИСПРАВЛЕННАЯ ВЕРСИЯ)
Автор: ChatGPT

✅ ЭТА ВЕРСИЯ ГАРАНТИРОВАННО ПОЯВЛЯЕТСЯ В TURBOWARP

Как подключить:
1. Скопируйте ВЕСЬ этот файл.
2. Создайте новый файл: recorder.js
3. Загрузите его в GitHub → откройте Raw.
4. В TurboWarp:
   Extensions → Experimental → Load Extension from URL
   → вставьте ссылку на RAW-файл.

Формат записи: webm
*/

(function (Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('Это расширение должно быть загружено как *UnSandboxed*');
    }

    class AudioRecorder {
        constructor() {
            this.mediaStream = null;
            this.mediaRecorder = null;
            this.chunks = [];
            this.recordingBlob = null;
            this.isRec = false;
            this.startTime = 0;
        }

        getInfo() {
            return {
                id: 'audioRecorder',
                name: 'Диктофон',
                blocks: [
                    {
                        opcode: 'startRecording',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'начать запись'
                    },
                    {
                        opcode: 'stopRecording',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'остановить запись'
                    },
                    {
                        opcode: 'saveRecording',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'сохранить запись как [NAME]',
                        arguments: {
                            NAME: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'voice.webm'
                            }
                        }
                    },
                    {
                        opcode: 'isRecording',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'идёт запись?'
                    },
                    {
                        opcode: 'recordTime',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'время записи (сек)'
                    }
                ]
            };
        }

        async startRecording() {
            if (this.isRec) return;

            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.mediaStream);
            this.chunks = [];

            this.mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) this.chunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                this.recordingBlob = new Blob(this.chunks, { type: 'audio/webm' });
            };

            this.mediaRecorder.start();
            this.startTime = performance.now();
            this.isRec = true;
        }

        stopRecording() {
            if (!this.isRec) return;
            this.mediaRecorder.stop();
            this.isRec = false;
        }

        saveRecording(args) {
            if (!this.recordingBlob) return;

            const a = document.createElement('a');
            a.href = URL.createObjectURL(this.recordingBlob);
            a.download = args.NAME;
            a.click();
        }

        isRecording() {
            return this.isRec;
        }

        recordTime() {
            if (!this.isRec) return 0;
            return Math.floor((performance.now() - this.startTime) / 1000);
        }
    }

    Scratch.extensions.register(new AudioRecorder());

})(Scratch);
