from flask import Flask, render_template, send_from_directory, request
import random
import pandas as pd
import pickle
import os
from music21 import converter

app = Flask(__name__)

# @app.route("/")
# def hello():
    # return render_template('index.html')

# Path for our main Svelte page
@app.route("/")
def base():
    return send_from_directory('client/public', 'index.html')

# Function to use music21 library functions to get the "textual" representation of a MIDI piece:
def getWordsFromMidi(row):
    # try:
        parsed = converter.parse(row['midi'])
        chordified = parsed.chordify()
        words = []
        for chord in chordified.recurse().getElementsByClass('Chord'):
            words.append(''.join([str(pitch) for pitch in chord.pitches]) + str(chord.duration.quarterLength))
        return ' '.join(words)
    # except:
    #     pass # This was necessary as music21 was unable to parse some of the MIDIs in the dataset...for some reason
        # return 'ERROR'

def makePrediction(filename):
    dummy_df = pd.DataFrame()
    dummy_df['midi'] = [filename]
    dummy_df['midi_text'] = dummy_df.apply(getWordsFromMidi, axis=1)
    print(dummy_df)
    transformer = pickle.load(open('app/transformer.pkl', 'rb'))
    vectorized_dummy = transformer.transform(dummy_df['midi_text'])
    model = pickle.load(open('app/model.pkl', 'rb'))
    return str(model.predict(vectorized_dummy))

# Path for all the static files (compiled JS/CSS, etc.)
@app.route("/<path:path>")
def home(path):
    return send_from_directory('client/public', path)

@app.route("/rand")
def hello():
    return str(random.randint(0, 100))

@app.route('/predict')
def result():
    return makePrediction('app/k001.mid')

@app.route('/upload', methods=['POST'])
def upload():
    uploaded_file = request.files['file']
    filename = 'UPLOAD.mid'
    uploaded_file.save(os.path.join('app/upload', filename))
    return makePrediction(os.path.join('app/upload', filename))

if __name__ == "__main__":
    app.run()