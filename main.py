import os
import wave
import vosk
import json
import subprocess

# Создаем необходимые папки, если их еще нет
def setup_directories():
    os.makedirs("audio", exist_ok=True)

# Конвертируем OGG в WAV
def convert_ogg_to_wav(ogg_file, wav_file):
    command = ['ffmpeg', '-i', ogg_file, wav_file]
    subprocess.run(command, check=True)

# Распознаем текст из WAV файла с помощью Vosk
def transcribe_audio(wav_file):
    model = vosk.Model("/Users/mishalka/Desktop/vosk_speech_recognition/models/vosk-model-small-ru-0.22")  # Используйте абсолютный путь
    
    with wave.open(wav_file, "rb") as wf:
        if wf.getnchannels() != 1:
            raise ValueError("Аудиофайл должен быть моно.")
        
        rec = vosk.KaldiRecognizer(model, wf.getframerate())
        
        text_result = ""
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                text_result += result.get("text", "") + " "
        
        final_result = json.loads(rec.FinalResult())
        text_result += final_result.get("text", "")
    
    return text_result.strip()

def main(ogg_file):
    setup_directories()

    wav_file = ogg_file.replace(".ogg", ".wav")  # Путь для сохранения файла .wav
    
    # Конвертируем Ogg в Wav
    convert_ogg_to_wav(ogg_file, wav_file)
    
    # Распознаем текст из Wav
    text = transcribe_audio(wav_file)
    
    print("Распознанный текст:")
    print(text)

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Пожалуйста, укажите путь к OGG файлу.")
        sys.exit(1)
    
    ogg_file = sys.argv[1]
    main(ogg_file)
