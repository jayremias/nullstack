//import files from './files';

const environment = { client: false, server: true };

environment.development = __dirname.indexOf('.development') > -1;
environment.production = !environment.development;

environment.mode = process.env.NULLSTACK_ENVIRONMENT_MODE || 'ssr';

environment.key = "{{NULLSTACK_ENVIRONMENT_KEY}}"

environment.name = process.env.NULLSTACK_ENVIRONMENT_NAME || '';

Object.freeze(environment);

export default environment;