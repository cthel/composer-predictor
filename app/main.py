from flask import Flask, send_from_directory, request
import pandas as pd
import pickle
import os
from music21 import converter


app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 1024 * 25    # 25KB limit


@app.route("/")
def base():
    return send_from_directory('client/public', 'index.html')


# Function to use music21 library functions to get the "textual" representation of a MIDI file:
def getWordsFromMidi(row):
    parsed = converter.parse(row['midi'])
    chordified = parsed.chordify()
    words = []
    for chord in chordified.recurse().getElementsByClass('Chord'):
        words.append(''.join([str(pitch) for pitch in chord.pitches]) + str(chord.duration.quarterLength))
    return ' '.join(words)


def makePrediction(filename):
    df = pd.DataFrame()
    df['midi'] = [filename]
    df['midi_text'] = df.apply(getWordsFromMidi, axis=1)
    try:    #prod
        transformer = pickle.load(open('app/transformer.pkl', 'rb'))
    except: #dev
        transformer = pickle.load(open('transformer.pkl', 'rb'))
    vectorized_df = transformer.transform(df['midi_text'])
    try:    #prod
        model = pickle.load(open('app/model.pkl', 'rb'))
    except: #dev
        model = pickle.load(open('model.pkl', 'rb'))
    return str(model.predict(vectorized_df))


@app.route("/<path:path>")
def home(path):
    return send_from_directory('client/public', path)


@app.route('/upload', methods=['POST'])
def upload():
    uploaded_file = request.files['file']
    filename = 'UPLOAD.mid'
    try:    #prod
        uploaded_file.save(os.path.join('app/upload', filename))
        return makePrediction(os.path.join('app/upload', filename))
    except: #dev
        uploaded_file.save(os.path.join('upload', filename))
        return makePrediction(os.path.join('upload', filename))


if __name__ == "__main__":
    app.run()