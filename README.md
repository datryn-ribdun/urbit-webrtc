# urbit-webrtc

## Packages
- `icepond`: Gall agent and marks for ICE server acquisition
- `icepond-js`: Javascript library for fetching ICE servers over airlock from icepond
- `icepond-test`: React app demonstrating icepond
- `switchboard`: Gall agent and marks for signalling WebRTC peer connections
- `switchboard-js` Javascript library for setting up WebRTC peer connections via Urbit airlock to switchboard
- `pal-js` Javascript library interacting with ~paldev's %pals

## Design
See [DESIGN.md](DESIGN.md)

## Getting Started

Run `npm i && npm run bootstrap` to get started. This project uses [lerna](https://lerna.js.org/) to manage the `switchboard-js` and `icepond-js` packages. Add a `.env.local` file to the `campfire` directory with the following entry `VITE_SHIP_URL=https://yourshipurl.com` replacing "https://yourshipurl.com" with your actual url.

Whenever working you can simply run `npm run dev` from the root directory which will simultaneously watch both packages for any changes and run the development server for `campfire`. It will proxy requests to the ship url added above. That ship will have to have `campfire` installed.

When it's time to release `campfire` running `npm run build` will build all packages and `campfire` itself. The resulting `campfire/dist` folder is then ready to be made into a glob.

If either `switchboard-js` or `icepond-js` are updated, they can be published to npm using `npm run publish`.
