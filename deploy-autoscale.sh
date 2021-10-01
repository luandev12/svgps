aws ec2 describe-instances  --filters "Name=tag:aws:autoscaling:groupName,Values=ProdHusble_Render_AutoScale" --region ap-southeast-1 | grep PrivateIpAddress | awk '{print $2}' | uniq -u |  tr -d '"' | tr -d ',' | tr -d '[' | grep -v '^$' > ~/list-api-ip-render.txt
echo "List API instance:" \n
cat ~/list-api-ip-render.txt

USER=centos
SOURCE="/srv/husble-render/"

while read IP; do
    echo "Deploy code to instance: " $IP
    rsync -hrzog --chown centos:centos --delete --bwlimit=8192 --timeout=600 --rsync-path="sudo rsync" -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" ./ $USER@$IP:$SOURCE
done < ~/list-api-ip-render.txt

while read IP; do
    echo "Clear cache... "
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $USER@$IP " cd /srv/husble-render/ && pm2 restart husble-render" &
done < ~/list-api-ip-render.txt
