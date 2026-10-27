# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

The landing page (`website/`) and these docs are deployed together to [rnsac.appandflow.com](https://rnsac.appandflow.com) by Vercel on every push to `main`, with the docs served under `/docs/`. Pull requests get a preview deployment. The build is configured in `vercel.json` at the repository root.
