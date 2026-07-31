# Scholarship finder

This is a web app created to help students looking for funding to access information about open opporunities. 

The app is built on top of the [open Scholarships](https://rapidapi.com/chrismoore044/api/open-scholarships) from the rapidAPI platform and was built by Chris Moore. More information about the API can be found on his [GitHub](https://github.com/Grudged/open-scholarships).

This App is built using:
- html
- css
- JS

It is then deployed on web server with ip: 44.204.87.91 and has a proxy server with ip: 3.82.141.14 intended to manage traffic.

## Deployment on web server
for web-02 server, I created new directory dedicated to the 'scholarship-finder' site in /var/www/ directory and /etc/nginx/sites-available.
within the /etc/nginx/sites-available/scholarship-finder configuragions I referenced /var/www/scholarship-finder as the root and added the /etc/nginx/sites-available/scholarship-finder symlink in /etc/nginx/sites-enabled/ while also removing the default one so the server can serve the right content.
