import React, { FC, useState } from "react";
import styled from "styled-components";
import { Flex, Spinner, Ship, Text } from "@holium/design-system";
import { useStore } from "../stores/root";
import { observer } from "mobx-react";
import { CallOld } from "../components/CallOld";
import { Campfire } from "../icons/Campfire";
import "../styles/animations.css"

const Main = styled.main`
  position: relative;
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: row;
  background: #fbfbfb;
`;

export const MeetingSpace: FC<any> = observer(() => {
  const { mediaStore, urchatStore } = useStore();
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <Flex
      style={{ background: "#FBFBFB" }}
      flex={1}
      height="100vh"
      width="100%"
      justifyContent="center"
      alignItems="center"
      flexDirection="row"
    >
        <Flex
          style={{ background: "#EBEBEB" }}
          width="75%"
          height="90%"
          m={10}
      justifyContent="center"
      alignItems="center"
        >
          {!urchatStore.dataChannelOpen && (
            <Flex
              flexDirection="column"
              width="100%"
              justifyContent="center"
              alignItems="center"
            >
              <Campfire className="animated-fading" />
              <Text fontSize={5} fontWeight={400} opacity={0.9}>Please wait while your ship connects to the call...</Text>
            </Flex>
          )}
        </Flex>
        <Flex
          width="25%"
          flexDirection="column"
          gap={6}
          m={10}
          height="90%"
          >
          <Text fontSize={5} fontWeight={400} opacity={0.9}>Participants</Text>
          <Ship patp={urchatStore.urbit.ship} />
          <Text fontSize={5} fontWeight={400} opacity={0.9} size={20} title="Messages sent over WebRTC">Chat</Text>
        </Flex>
    </Flex>
  );
});
