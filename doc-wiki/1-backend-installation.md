# Installation
## Windows 
1. Install composer: https://getcomposer.org/download/
  *  Download zip from: [getcomposer.org](https://getcomposer.org/download/)
2. Install mysql: https://dev.mysql.com/downloads/installer/
3. Install [PHP 8.2](https://www.php.net/releases/8.2/en.php) 
  * x64 Non Thread Safe: 
4. Install [laravel](https://laravel.com/docs/4.2)
```
composer global require laravel/installer
laravel -v
```
## Linux
1. Install composer: 
```
sudo apt update
sudo apt install composer -y
composer -V
```

2. InstalL [MySQL](https://dev.mysql.com/downloads/installer/)
```bash
# Check if MySQL is installed:
sudo apt update
sudo apt install mysql-server -y
```
```bash
# Start and enable MySQL:
sudo systemctl start mysql
sudo systemctl enable mysql
sudo systemctl status mysql

# Run MySQL
mysql -u root -p --socket=/var/run/mysqld/mysqld.sock
```

3. Install [PHP 8.2](https://www.php.net/releases/8.2/en.php)
```
sudo apt update
sudo apt install software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php8.2 php8.2-cli php8.2-fpm libapache2-mod-php8.2 -y
```

4. Install [laravel](https://laravel.com/docs/4.2)
```bash
# start installation
composer global require laravel/installer
# Add the Composer global bin directory to your PATH:
echo 'export PATH="$HOME/.config/composer/vendor/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
laravel -v
```
# Operation
## Prepare the project framework
1. build it: `laravel new eventy-backend`
```
Choose  starter kit : **None** # Since it is only Backend
testing framework: **Pest** # Since it is new and easier
database: **MySQL**
default database migrations:**YES**
npm install : **NO** since it is only Backend
```
P.S: if error found : run `sudo systemctl restart php8.2-fpm 2>/dev/null`
## Creating the Project

## Run 
1. Un-comment the following in the file `/etc/php/8.2/cli/php.ini`
```
extension=curl
extension=mbstring
extension=mysqli
extension=openssl
extension=pdo_mysql
```
- to discover the location: run on the terminal `php --ini`

2. Download [phpMyAdmin](https://www.phpmyadmin.net/downloads/)

3. Run the server using the command from the directory phpMyAdmin
```
php -S localhost:8080
# if you are running from server
php artisan serve --host=localhost --port=8080
```

References:
- [Installing Laravel 9, Composer and PHP 8 on Ubuntu (20.04)](https://www.youtube.com/watch?v=YsqTZfeo_jk)


