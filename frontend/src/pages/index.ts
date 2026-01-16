import { setTitle, handleRoute } from '@app/routing';
import './root/root.ts'
import './pong/pong.ts'
import './login/login.ts'
import './signin/signin.ts'
import './ttt/ttt.ts'
import './profile/profile.ts'
import './logout/logout.ts'
import './pongHistory/pongHistory.ts'
import './tttHistory/tttHistory.ts'
import './tourHistory/tourHistory.ts'
import './friendList/friendList.ts'

// ---- Initial load ----
setTitle("");
handleRoute();
