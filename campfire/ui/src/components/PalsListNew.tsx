
import { Ship, Button, Flex, Text } from "@holium/design-system";
import { observer } from "mobx-react";
import React from "react";

interface PalsListProps {
    callPal: (ship: string) => void;
    mutuals: string[];
}
export const PalsListNew = observer(({ mutuals, callPal }: PalsListProps) => {
    if (mutuals?.length > 0) {
        return (
            <>
            <Text title="list of mutuals from %pals" fontSize={4} fontWeight={600} opacity={0.5}>
                Speed Dial
            </Text>
                <Flex alignItems="flex-start" gap={6} flexDirection="column">
                {
                    mutuals.map((shipName) => {
                        return (
                            <Button key={shipName} onClick={() => callPal(shipName)}>
                                <Ship patp={shipName} />
                            </Button>
                        )
                    })
                }
                </Flex>
            </>)
    } else {
        return <span title="Must have ~paldev/pals installed and have mutuals">No %pals to Speed Dial</span>;
    }

})