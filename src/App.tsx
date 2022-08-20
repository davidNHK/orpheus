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
import basicPitchModel from '@spotify/basic-pitch/model/model.json';
import { Midi, MidiJSON } from '@tonejs/midi';
import { ChangeEvent, useState } from 'react';

function AudioSourceProvider({
  onRecordedAudioSource,
}: {
  onRecordedAudioSource: (
    e: CustomEvent<{ toneJSMidiJSON: MidiJSON; value: AudioBuffer }>,
  ) => void;
}) {
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
    const basicPitch = new BasicPitch(basicPitchModel as any);
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
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      ),
    );
    return { audioBuffer, noteEventTimes };
  }
  return (
    <section className={'tw-my-2 tw-flex tw-content-center'}>
      {!isRecording && (
        <FileUpload
          onChange={async (e: ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files) return;
            const [file] = e.target.files;
            const { audioBuffer, noteEventTimes } = await blobToNoteEventTime(
              file,
            );
            onRecordedAudioSource(
              new CustomEvent('uploaded-audio-source', {
                detail: {
                  toneJSMidiJSON: await noteEventTimeToMidiJSON(noteEventTimes),
                  value: audioBuffer,
                },
              }),
            );
          }}
        >
          Click to Upload
        </FileUpload>
      )}
      <AudioRecorder
        onStartRecording={() => setIsRecording(true)}
        onStopRecording={async e => {
          setIsRecording(false);
          const { audioBuffer, noteEventTimes } = await blobToNoteEventTime(
            new Blob(e.detail.value, {
              type: 'audio/webm',
            }),
          );
          onRecordedAudioSource(
            new CustomEvent('recorded-audio-source', {
              detail: {
                toneJSMidiJSON: await noteEventTimeToMidiJSON(noteEventTimes),
                value: audioBuffer,
              },
            }),
          );
        }}
      />
    </section>
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
      <Layout.Footer>Footer</Layout.Footer>
    </Layout.Page>
  );
}

export default App;
