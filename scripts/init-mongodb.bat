@echo off
mkdir "C:\data\db"
echo MongoDB data directory created at C:\data\db
echo Starting MongoDB...
mongod --dbpath="C:\data\db"
