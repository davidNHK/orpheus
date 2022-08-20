import {
  AudioRecorder,
  Divider,
  FileUpload,
  Layout,
} from '@busybox/react-components';
import {
  addPitchBendsToNoteEvents,
  BasicPitch,
  NoteEventTime,
  noteFramesToTime,
  outputToNotesPoly,
} from '@spotify/basic-pitch';
import basicPitchModel from '@spotify/basic-pitch/model/model.json?url';
import { Midi, MidiJSON } from '@tonejs/midi';
import { ChangeEvent, useEffect, useState } from 'react';

function AudioSourceProvider({
  onRecordedAudioSource,
}: {
  onRecordedAudioSource: (e: CustomEvent<{ toneJSMidiJSON: MidiJSON }>) => void;
}) {
  const [progress, updateProgress] = useState<number>(1);
  const [midiJson, setMidiJSON] = useState<MidiJSON | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  async function noteEventTimeToMidiJSON(notes: NoteEventTime[]) {
    const midi = new Midi();
    const track = midi.addTrack();
    notes.forEach(note => {
      track.addNote({
        duration: note.durationSeconds,
        midi: note.pitchMidi,
        time: note.startTimeSeconds,
        velocity: note.amplitude,
      });
      if (note.pitchBends !== undefined && note.pitchBends !== null) {
        note.pitchBends.forEach((bend, i) => {
          track.addPitchBend({
            time:
              note.startTimeSeconds +
              (i * note.durationSeconds) / note.pitchBends!.length,
            value: bend,
          });
        });
      }
    });
    return midi.toJSON();
  }
  async function blobToNoteEventTime(src: Blob) {
    const reader = new FileReader();
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.readAsArrayBuffer(src);
      reader.onloadend = () => {
        resolve(reader.result as ArrayBuffer);
      };
      reader.onerror = reject;
    });

    const audioCtx = new AudioContext({
      sampleRate: 22050, // https://github.com/spotify/basic-pitch-ts/blob/16d4c6a68e2c070726ba7c26a64c13eab4a434c4/src/inference.ts#L35
    });
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const basicPitch = new BasicPitch(basicPitchModel);
    const noteEventTimes = await new Promise<NoteEventTime[]>(resolve =>
      basicPitch.evaluateModel(
        audioBuffer.getChannelData(0),
        (f: number[][], o: number[][], c: number[][]) => {
          resolve(
            noteFramesToTime(
              addPitchBendsToNoteEvents(c, outputToNotesPoly(f, o)),
            ),
          );
        },
        p => {
          updateProgress(p);
        },
      ),
    );
    return { audioBuffer, noteEventTimes };
  }
  useEffect(() => {
    if (!(progress >= 1) || !midiJson) return;
    onRecordedAudioSource(
      new CustomEvent('recorded-audio-source', {
        detail: {
          toneJSMidiJSON: midiJson,
        },
      }),
    );
    setMidiJSON(null);
    updateProgress(0);
  }, [midiJson, onRecordedAudioSource, progress]);
  return (
    <div className={'tw-my-2 tw-flex tw-flex-col'}>
      <section className={'tw-flex tw-content-center'}>
        {!isRecording && (
          <FileUpload
            onChange={async (e: ChangeEvent<HTMLInputElement>) => {
              if (!e.target.files) return;
              const [file] = e.target.files;
              const { noteEventTimes } = await blobToNoteEventTime(file);
              setMidiJSON(await noteEventTimeToMidiJSON(noteEventTimes));
            }}
          >
            Click to Upload
          </FileUpload>
        )}
        <AudioRecorder
          onStartRecording={() => setIsRecording(true)}
          onStopRecording={async e => {
            setIsRecording(false);
            const { noteEventTimes } = await blobToNoteEventTime(
              new Blob(e.detail.value, {
                type: 'audio/webm',
              }),
            );
            setMidiJSON(await noteEventTimeToMidiJSON(noteEventTimes));
          }}
        />
      </section>
      {progress > 0 && progress < 1 && (
        <section>{Math.ceil(progress * 100)}%</section>
      )}
    </div>
  );
}

function App() {
  const [midiJson, setMidiJSON] = useState<MidiJSON | null>(null);
  return (
    <Layout.Page className={'tw-mx-auto'} data-testid={'app'}>
      <Layout.Header>
        <AudioSourceProvider
          onRecordedAudioSource={e => {
            setMidiJSON(e.detail.toneJSMidiJSON);
          }}
        />
        <Divider />
      </Layout.Header>
      <Layout.Content>
        <Layout.Main>
          {midiJson && <pre>{JSON.stringify(midiJson, null, 4)}</pre>}
        </Layout.Main>
      </Layout.Content>
      <Layout.Footer>
        <Divider />
        Footer
      </Layout.Footer>
    </Layout.Page>
  );
}

export default App;
