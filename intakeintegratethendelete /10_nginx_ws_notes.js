// Documentation-only: NGINX WS upgrade snippet as string (place in nginx.conf, not JS).

const NGINX_SNIPPET = `
location /ws {
  proxy_pass http://127.0.0.1:3010;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_read_timeout 60m;
}
`;
module.exports = { NGINX_SNIPPET };
