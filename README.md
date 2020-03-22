# libVirt Web (nodejs)

A simple web interface based on [libVirt](https://libvirt.org/) and [nodejs](https://nodejs.org/).

> This project is still a **Work In Progress**, it might not work correctly on your side.
>
> Please, create an issue in this case so I can track and fix it.
>
> Thank you.

_If you were looking for a `PHP` version: <https://github.com/Jiab77/libvirt-web>._

## Preview

> Images will be added soon.

## Installation

The installation process is pretty simple and will require only few dependencies.

The web interface should be able to run on desktops and servers.

## Dependencies

There is only few dependencies required:

1. `libvirt-bin` (The `virsh` command should be provided by [libVirt](https://libvirt.org/))
2. `virt-viewer`
3. `libguestfs`
4. `nodejs`
5. `npm`

> I have dropped the ImageMagick `convert` command from dependencies.

## Plaforms

The project has been tested on [Pop_OS!](https://system76.com/pop), a Linux distribution based on [Ubuntu 18.04 LTS](https://wiki.ubuntu.com/BionicBeaver/ReleaseNotes).

### Ubuntu and derivated distribs

You should only need to install these packages:

```bash
# Install dependencies (desktop)
sudo apt install libvirt-bin virt-viewer libguestfs-tools nodejs npm

# Install dependencies (server)
sudo apt install libvirt-bin libguestfs-tools nodejs npm

# Install nodejs modules
npm install ppm-bin
```

> I still need to validate the packages list so this might change later.

## Run the web interface

You can run the web interface by using the embedded web server from `nodejs` or using `apache` or `nginx`.

### PHP Embedded Web Server

You can start the server that way:

```bash
cd libvirt-web-nodejs
node server.js
```

Edit the `server.js` file to change the `listen` port or define the `LIBVIRT_WEB_PORT` environment variable.

> `sudo` is not required to run the server. It is required only if you want to run the server on a port below **1024**.
>
> You can also choose any other ports than **8001**.

Then navigate to [http://localhost:8001](http://localhost:8001) with your internet browser.

> I'm using Chromium but it should work on any other modern browser.

### Apache / nginx

This setup is not tested yet and will be documented later.

## Missing / Not Working

Here will be listed missing features / those not working correctly.

* Remote connection on VM's using `virt-viewer`.
  * Works on local only...
* Connection to remote hypervisor.
  * Not implemented yet / not correctly...
* ISO image upload.
  * The upload is working but the uploaded file can't be moved to `/var/lib/libvirt/images`...
  * This is due to access restricted to `sudoers` with filesystem permissions.
* Graphics are still missing.

## Thanks

Thanks to the respective developers for their amazing work.

Huge thanks to [@baslr](https://github.com/baslr) for the [node-ppm-bin](https://github.com/baslr/node-ppm-bin) module.

## Contributions

Feel free to contribute by creating pull requests or new issues.

## Contact

You can reach me on Twitter by using [@jiab77](https://twitter.com/jiab77).
