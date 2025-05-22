# Duolingo thingy

I just forked this since I dont want to lose my streak anymore (i lost my 734 day streak and ive never recovered from that traumatic experience) whenever im on vacation.

### Preperation (required)
1. Duolingo Auth Token
    - To get this information run the following code in your web browser console:
```
    document.cookie
        .split(';')
        .map(cookie => cookie.trim())
        .find(cookie => cookie.includes('jwt_token'))
        ?.split('=')[1];
```
2. Duolingo User ID
    - To get this information run the following code in your web browser console:
```
    document.cookie
        .split(';')
        .map(cookie => cookie.trim())
        .find(cookie => cookie.includes('logged_out_uuid'))
        ?.split('=')[1];
```
3. After obtaining these values, store each of them as repository secrets. 
    - Go to repository Settings > Secrets and variables > Actions
    - Click "New repository secret"
    - Once in the page, fill out the name for the secret.
        - If entering your token, name should be: TOKEN
        - If entering your user ID, name should be: USER_ID
    - Click add secret
    - Repeat for both token and user ID.


i have no time nowadays to do my duolingo, but i still do it once in a while
