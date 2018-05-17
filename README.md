Snowdrop Website (Angular)
=====================

If this is the first time you are starting the UI, you need to run

```bash
$ npm install
```

If you trying to refresh your install you can run:

```bash
$ npm run reinstall
```

Start the app by executing the following.

```bash
$ npm start
```

If you want the UI to use a local version of the backend, you need to set the following environment variables:

```bash   
$ export LAUNCHER_BACKEND_URL=http://localhost:8080/api/
$ export LAUNCHER_MISSIONCONTROL_URL=ws://localhost:8080
```

More details on running a local version of the backend are available [here][2].

## Documentation and Guides settings

These parts of the site can be configured using the [registry.json][3] file, which contains a list of documents to be displayed.

## Deploy with S2I

```
find . | grep openshiftio | grep application | xargs -n 1 oc apply -f
oc new-app --template=snowdrop-site-angular
```

## Production Build

Location of the [backend][2] can be determined at runtime (via `settings.json`) or at build time.
If `LAUNCHER_BACKEND_URL` environment variable is set at build time, this value will be used to connect to the backend.
Otherwise [settings.json][1] will be fetched at runtime and the contents used connect to the backend.

To generate production build, set the backend url (the host and port of where
[backend][2] is deployed) either in the [settings.json][1] or as `LAUNCHER_BACKEND_URL` environment variable
and run the `npm` command as given below:

```bash
npm run build:prod
```

The build output will be under `dist` directory.

[1]: https://github.com/snowdrop/snowdrop-site-angular/blob/master/src/assets/settings.json
[2]: https://github.com/fabric8-launcher/launcher-backend
[3]: https://github.com/snowdrop/snowdrop-site-angular/blob/master/src/assets/registry.json
