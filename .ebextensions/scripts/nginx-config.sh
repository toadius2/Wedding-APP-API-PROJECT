#!/usr/bin/env bash
{ cat .ebextensions/scripts/nginx-introduce-log_ua; cat /tmp/deployment/config/#etc#nginx#conf.d#00_elastic_beanstalk_proxy.conf; } > /tmp/deployment/config/tmp_version.conf
mv /tmp/deployment/config/tmp_version.conf /tmp/deployment/config/#etc#nginx#conf.d#00_elastic_beanstalk_proxy.conf -f
sed -i -e "s/access_log  \/var\/log\/nginx\/access.log  main;/error_page 413 \/RequestEntityTooLargeError.json;\nlocation = \/RequestEntityTooLargeError.json {\n                root \/usr\/share\/nginx\/html;\n                internal;\n        }\n   access_log  \/var\/log\/nginx\/access.log  main;/" /tmp/deployment/config/#etc#nginx#conf.d#00_elastic_beanstalk_proxy.conf
sed -i -e "s/access_log  \/var\/log\/nginx\/access.log  main;/access_log  \/var\/log\/nginx\/access.log  main if=\$log_ua;/" /tmp/deployment/config/#etc#nginx#conf.d#00_elastic_beanstalk_proxy.conf
sed -i -e "s/access_log \/var\/log\/nginx\/healthd\/application.log.\$year-\$month-\$day-\$hour healthd;/access_log \/var\/log\/nginx\/healthd\/application.log.\$year-\$month-\$day-\$hour healthd if=\$log_ua;/" /tmp/deployment/config/#etc#nginx#conf.d#00_elastic_beanstalk_proxy.conf
sed -i -e "s/'\"\$http_user_agent\" \"\$http_x_forwarded_for\"';/'\"\$http_user_agent\" \"\$http_x_forwarded_for\" \$request_time';/" /tmp/deployment/config/#etc#nginx#nginx.conf



