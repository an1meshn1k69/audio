/*
TurboWarp Audio Recorder Extension
Author: ChatGPT

Описание:
- Блоки: startRecording, stopRecording, saveRecording, isRecording, recordingDuration
- Использует MediaRecorder API, сохраняет запись в формате webm

Как установить:
1. Разместите этот файл на сервере (например, GitHub Gist/raw) и получите прямой URL.
2. В TurboWarp откройте Extensions -> Experimental -> Load extension from URL и вставьте ссылку на raw-файл.

Ограничения:
- Браузер запросит разрешение на доступ к микрофону.
- Формат сохраняемой записи — webm/opus (широко поддерживается современными браузерами).
*/

class TurboWarpAudioRecorder {
    constructor(runtime) {
        this.runtime = runtime;
        this.mediaStream = null;
        this.mediaRecorder = null;
        this.chunks = [];
        this.recordingStartTime = null;
        this.recordingBlob = null;
        this.isRec = false;

        // Привязки методов (TurboWarp вызывает их по имени)
        this.startRecording = this.startRecording.bind(this);
        this.stopRecording = this.stopRecording.bind(this);
        this.saveRecording = this.saveRecording.bind(this);
        this.isRecording = this.isRecording.bind(this);
        this.recordingDuration = this.recordingDuration.bind(this);
    }

    getInfo() {
        return {
            id: 'audioRecorder',
            name: 'Диктофон',
            color1: '#4a90e2',
            color2: '#3a78c2',
            blocks: [
                {
                    opcode: 'startRecording',
                    blockType: 'command',
                    text: 'начать запись',
                },
                {
                    opcode: 'stopRecording',
                    blockType: 'command',
                    text: 'остановить запись',
                },
                {
                    opcode: 'saveRecording',
                    blockType: 'command',
                    text: 'сохранить запись как [FILENAME]',
                    arguments: {
                        FILENAME: {
                            type: 'string',
                            defaultValue: 'recording.webm'
                        }
                    }
                },
                {
                    opcode: 'isRecording',
                    blockType: 'boolean',
                    text: 'идёт запись?'
                },
                {
                    opcode: 'recordingDuration',
                    blockType: 'reporter',
                    text: 'длительность записи (с)',
                }
            ],
            menus: {}
        };
    }

    async _ensureMedia() {
        if (this.mediaStream) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('API доступа к микрофону не поддерживается в этом браузере.');
        }
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    async startRecording() {
        try {
            if (this.isRec) return; // уже идёт
            await this._ensureMedia();
            this.chunks = [];
            this.mediaRecorder = new MediaRecorder(this.mediaStream);
            this.mediaRecorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) this.chunks.push(e.data);
            };
            this.mediaRecorder.onstop = () => {
                this.recordingBlob = new Blob(this.chunks, { type: 'audio/webm' });
            };
            this.mediaRecorder.start();
            this.recordingStartTime = performance.now();
            this.isRec = true;
        } catch (err) {
            console.error('Ошибка при старте записи:', err);
            // TurboWarp не поддерживает бросание исключений в блоках — можно показать предупреждение в консоли
        }
    }

    stopRecording() {
        if (!this.isRec) return;
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.isRec = false;
        this.recordingStartTime = null;
    }

    saveRecording(args) {
        const filename = (args && args.FILENAME) ? args.FILENAME : 'recording.webm';
        if (!this.recordingBlob) {
            console.warn('Нет доступной записи для сохранения.');
            return;
        }
        const url = URL.createObjectURL(this.recordingBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    isRecording() {
        return !!this.isRec;
    }

    recordingDuration() {
        if (this.isRec && this.recordingStartTime) {
            const secs = (performance.now() - this.recordingStartTime) / 1000;
            return Math.round(secs * 100) / 100; // два знака после запятой
        }
        if (this.recordingBlob) {
            // если запись остановлена — вернуть длину в секундах, если известна
            // Для простоты — вернуть 0.0 (получение точной длины требует декодирования AudioContext)
            return 0;
        }
        return 0;
    }
}

(function() {
    if (typeof window === 'undefined') return;
    if (!window.vm) {
        // TurboWarp подставляет vm в глобальную область при загрузке расширений по URL.
        // Если расширение загружают не в TurboWarp — пользователь увидит сообщение в консоли.
        console.warn('TurboWarp VM не обнаружен. Загрузите этот файл как расширение в TurboWarp.');
    }
    // Регистрация расширения производится автоматически самой платформой при загрузке файла.
    // Для совместимости с разными сборками Scratch/TurboWarp, экспортируем класс в window
    window.TurboWarpAudioRecorder = TurboWarpAudioRecorder;
})();

export default TurboWarpAudioRecorder;
