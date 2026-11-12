# Duolingo thingy

I just forked this since I dont want to lose my streak anymore (i lost my 734 day streak and ive never recovered from that traumatic experience) whenever im on vacation.

### Setup
1. Get your Duolingo Auth Token by running this in your browser console on duolingo.com:
```javascript
document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1];
```
2. Store it as a repository secret named `TOKEN` in **Settings > Secrets and variables > Actions**.

i have no time nowadays to do my duolingo, but i still do it once in a while
