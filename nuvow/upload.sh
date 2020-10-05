BUCKET="mandaris"
CONTENT_TYPE="application/zip"
DATE=`date -R`
IN_FILE="revision.zip"
KEY="api.zip"
RESOURCE="/${BUCKET}/${KEY}"
HMAC="PUT\n\n${CONTENT_TYPE}\n${DATE}\n${RESOURCE}"

zip -r --exclude=.git/* --exclude=lib/* \
--exclude=upload.sh --exclude=bitbucket-pipelines.yml "$IN_FILE" .

SIGNATURE=`echo -en ${HMAC} | openssl sha1 -hmac ${API_SECRET} -binary | base64`

curl -X PUT -T "${IN_FILE}" \
  -H "Host: ${BUCKET}.s3.amazonaws.com" \
  -H "Date: ${DATE}" \
  -H "Content-Type: ${CONTENT_TYPE}" \
  -H "Authorization: AWS ${API_KEY}:${SIGNATURE}" \
  https://${BUCKET}.s3.amazonaws.com/${KEY}