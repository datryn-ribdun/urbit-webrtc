import React, { FC, useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { Route, Switch, useHistory } from "react-router";

// import { MediaStore } from "../stores/media";
// import { UrchatStore } from "../stores/urchat";

import {
  Box,
  Button,
  Flex,
  Icons,
  Input,
  Text,
  TextButton,
  theme,
  Ship,
  Search
} from "@holium/design-system";
import { Campfire } from "../icons/Campfire";
import { VideoPlus } from "../icons/VideoPlus";
import { useStore } from "../stores/root";
import { PalsListNew } from "../components/PalsListNew";

export interface Message {
  speaker: string;
  message: string;
}

export const StartMeetingPage: FC<any> = observer(() => {
  console.log("RERENDER START PAGE")
  const [meetingCode, setMeetingCode] = useState("");
  const { mediaStore, urchatStore, palsStore } = useStore();
  const [dataChannel, setDataChannel] = useState<RTCDataChannel>(null);
  const [dataChannelOpen, setDataChannelOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { push } = useHistory();

  const isSecure =
    location.protocol.startsWith("https") || location.hostname === "localhost";

  useEffect(() => {
    palsStore.loadPals();
    window.addEventListener("beforeunload", urchatStore.hangup);
    return () => window.removeEventListener("beforeunload", urchatStore.hangup);
  }, []);
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------

  const onTrack = useCallback((evt: Event & { track: MediaStreamTrack }) => {
    console.log("Incoming track event", evt);
    const { remote } = mediaStore;
    remote.addTrack(evt.track);
    // TODO: shouldn't need to set state on this
    // only doing it because it forces a rerender which I need to display shared screens that come in
    mediaStore.remote = remote;
  }, []);

  const placeCall = async (ship: string) => {
    mediaStore.resetStreams();
    console.log("placing call start");
    console.log(urchatStore);
    const call = await urchatStore.placeCall(ship, (conn) => {
      console.error("place call connection callback");
      setDataChannelOpen(false);
      setMessages([]);
      console.log("attempting to create conn data channel");
      const channel = conn.createDataChannel("campfire");
      channel.onopen = () => {
        console.log("channel opened");
        setDataChannelOpen(true);
        push(`/chat/${conn.uuid}`);
      };
      channel.onmessage = (evt) => {
        console.log("onmessage");
        const data = evt.data;
        const speakerId = ship.replace("~", "");
        setMessages((messages) =>
          [{ speaker: speakerId, message: data }].concat(messages)
        );
        console.log("channel message from " + speakerId + ": " + data);
      };
      setDataChannel(channel);
      conn.ontrack = onTrack;
    });
    console.log(call);

    mediaStore.getDevices(call);
  };

  const callPal = (ship: string) => {
    console.log("calling your pal: "+ship);
  }

  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  return (
    <Flex
      style={{ background: "#FBFBFB" }}
      flex={1}
      height="100vh"
      width="100%"
      justifyContent="center"
      alignItems="center"
      flexDirection="columns"
    >
      <Flex
        minWidth={650}
        maxWidth={950}
        width="50%"
        flexDirection="row"
        justifyContent="space-between"
      >
        <section>
          <Flex mb={6} flexDirection="column">
            <Text mb={1} fontSize={9} fontWeight={600}>
              Gather around
            </Text>
            <Text fontSize={5} fontWeight={400} opacity={0.5}>
              Join a chat or create a new one.
            </Text>
          </Flex>
          <Flex alignItems="flex-start" flexDirection="column">
            <Input
              bg="secondary"
              style={{
                fontSize: 18,
                height: 40,
                borderRadius: 6,
                minWidth: 370,
                background: theme.light.colors.bg.secondary,
              }}
              mb={4}
              placeholder="Enter a code or @p"
              value={meetingCode}
              rightInteractive
              rightIcon={
                <TextButton
                  disabled={meetingCode.length < 4}
                  onClick={() => placeCall(meetingCode)}
                >
                  <b>Join</b>
                </TextButton>
              }
              onChange={(evt: any) => setMeetingCode(evt.target.value)}
            />
            <Button
              style={{ fontSize: 14, borderRadius: 6 }}
              variant="custom"
              bg="#F8E390"
              color="#333333"
              onClick={() => push("/chat")}
            >
              <Box mr={2}>
                <VideoPlus />
              </Box>
              New video call
            </Button>
            <PalsListNew mutuals={palsStore.mutuals} callPal={callPal} />
          </Flex>
        </section>
        <section>
          <Flex>
            <Campfire />
          </Flex>
        </section>
      </Flex>
    </Flex>
  );
});
