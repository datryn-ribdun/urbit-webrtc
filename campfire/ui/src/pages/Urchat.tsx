import React, { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import useUrchatStore from "../useUrchatStore";
import { IncomingCallOld } from "../components/IncomingCallOld";
import { Route, Switch, useHistory } from "react-router";
import { ChatOld } from "../components/ChatOld";
import { CallOld } from "../components/CallOld";
import { Dialer } from "../components/Dialer";
// import { useMediaStore } from '../useMediaStore';
import { MediaStore } from "../stores/media";
import { useMock } from "../util";
import call from "../assets/enter-call.wav";
import { TurnOnRinger } from "../components/TurnOnRinger";
import { SecureWarning } from "../components/SecureWarning";
import { UrchatStore } from "../stores/urchat";
import { PalsListOld } from '../components/PalsListOld';

export interface Message {
  speaker: string;
  message: string;
}

export const Urchat = observer(() => {
  const {
    incomingCall,
    ongoingCall,
    answerCall: answerCallState,
    placeCall: placeCallState,
    rejectCall,
    startPals,
    hangup
  } = useUrchatStore();
  const mediaStore = new MediaStore();
  const urchatStore = new UrchatStore();

  // const { resetStreams, getDevices } = useMediaStore(s => ({ getDevices: s.getDevices, resetStreams: s.resetStreams }));
  const { push } = useHistory();

  // local state
  const [dataChannel, setDataChannel] = useState<RTCDataChannel>(null);
  const [dataChannelOpen, setDataChannelOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const isSecure =
    location.protocol.startsWith("https") || location.hostname === "localhost";

  // Set up callback to update device lists when a new device is added or removed

  useEffect(() => {
    console.log("initialize pals");
    startPals();
    window.addEventListener('beforeunload', hangup)
    return () => window.removeEventListener('beforeunload', hangup)
  }, [])

  useEffect(() => {
    if (isSecure && ongoingCall) {
      const audio = new Audio(call);
      audio.volume = 0.3;
      audio.play();
      push(`/old/chat/${ongoingCall.conn.uuid}`);

      const updateDevices = () => mediaStore.getDevices(ongoingCall);
      navigator.mediaDevices.addEventListener("devicechange", updateDevices);
      return () =>
        navigator.mediaDevices.removeEventListener(
          "devicechange",
          updateDevices
        );
    }
  }, [ongoingCall]);

  const onTrack = useCallback((evt: Event & { track: MediaStreamTrack }) => {
    console.log("Incoming track event", evt);
    const { remote } = mediaStore;
    remote.addTrack(evt.track);
    // TODO: shouldn't need to set state on this
    // only doing it because it forces a rerender which I need to display shared screens that come in
    mediaStore.remote = remote;
  }, []);

  // state-changing methods
  const answerCall = async () => {
    mediaStore.resetStreams();

    const call = await answerCallState((peer, conn) => {
      setDataChannelOpen(false);
      setMessages([]);
      conn.addEventListener("datachannel", (evt) => {
        const channel = evt.channel;
        channel.onopen = () => setDataChannelOpen(true);
        channel.onmessage = (evt) => {
          const data = evt.data;
          setMessages((messages) =>
            [{ speaker: peer, message: data }].concat(messages)
          );
          console.log("channel message", data);
        };
        setDataChannel(channel);
      });

      conn.ontrack = onTrack;
    });

    mediaStore.getDevices(call);
  };

  const placeCall = async (ship) => {
    mediaStore.resetStreams();

    const call = await placeCallState(ship, (conn) => {
      console.log("placing call");
      setDataChannelOpen(false);
      setMessages([]);
      const channel = conn.createDataChannel("campfire");
      channel.onopen = () => setDataChannelOpen(true);
      channel.onmessage = (evt) => {
        const data = evt.data;
        setMessages((messages) =>
          [{ speaker: "~" + ship, message: data }].concat(messages)
        );
        console.log("channel message from ~" + ship + ": " + data);
      };
      setDataChannel(channel);
      conn.ontrack = onTrack;
    });

    mediaStore.getDevices(call);
  };

  const sendMessage = useCallback(
    (msg: string) => {
      if (!useMock) {
        dataChannel?.send(msg);
      }

      const newMessages = [{ speaker: "me", message: msg }].concat(messages);
      console.log(messages, newMessages);
      setMessages(newMessages);
    },
    [messages, dataChannel]
  );


  return (
    <main className="relative flex flex-col lg:flex-row lg:gap-6 w-full h-full lg:p-8 text-gray-700">
      <section className="flex-auto lg:flex-1 flex flex-col justify-center h-[50%] lg:h-auto">
        <Switch>
          <Route path="/old/chat/:id">
            <CallOld connected={dataChannelOpen} />
          </Route>
          <Route path="/old/">
            <div className="flex justify-center items-center w-full h-full bg-pink-100 rounded-xl">
              <div>
                <h1 className="mb-6 mx-12 text-3xl font-semibold font-mono">
                  Campfire
                </h1>
                <Dialer placeCall={placeCall} />
              </div>
            </div>
          </Route>
        </Switch>
      </section>
      <aside className="flex-auto lg:flex-none lg:w-[33vw] lg:max-w-sm h-[50%] lg:h-auto">
        <Switch>
          <Route path="/old/chat/:id">
            <ChatOld
              sendMessage={sendMessage}
              messages={messages}
              ready={dataChannelOpen}
            />
          </Route>
          <Route path="/old/">
            <div className="h-full bg-gray-300 lg:rounded-xl">
              <PalsListOld placeCall={placeCall}/>
            </div>
          </Route>
        </Switch>
      </aside>
      {incomingCall && (
        <IncomingCallOld
          caller={incomingCall.call.peer}
          answerCall={answerCall}
          rejectCall={rejectCall}
        />
      )}
      {isSecure && <TurnOnRinger />}
      {!isSecure && <SecureWarning />}
    </main>
  );
});
