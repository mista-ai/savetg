```bash

npm install idb
npm init -y
sudo npm install -g rollup
```
create rollup.config.mjs
```mjs
export default {
    input: 'node_modules/idb/build/index.js',
    output: {
        file: 'libs/idb.js',
        format: 'es'
    }
};
```
```bash

rollup -c
```