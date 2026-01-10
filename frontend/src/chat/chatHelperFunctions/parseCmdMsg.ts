
/**
 *  function takes the input line of the chat and checks the it's not a cmd
 *  ex: @command "arg" or @command noarg
 *  ex: command @help - displays commands availble
 *  @param msgText : string from input line
 * 
 */

export function parseCmdMsg(msgText: string): string[] | undefined {

	if (!msgText?.trim()) return;
    msgText = msgText.trim();
    const command: string[] = ['', ''];
    if (!msgText.startsWith('@')) {
        command[0] = '@msg';
        command[1] = msgText;
        return command;
    }
    const noArgCommands = ['@quit', '@help', '@cls'];
    if (noArgCommands.includes(msgText)) {
        command[0] = msgText;
        command[1] = '';
        return command;
    }

	const ArgCommands = ['@profile', '@block'];
	const userName = msgText.indexOf(" ");
	const cmd2 = msgText.slice(0, userName).trim() ?? "";
	const user = msgText.slice(userName + 1).trim();
	if (ArgCommands.includes(cmd2)) {
    	    command[0] = cmd2;
    	    command[1] = user;
    	    return command;
	}
	const colonIndex = msgText.indexOf(":");
    if (colonIndex === -1) {
        command[0] = msgText;
        command[1] = '';
        return command;
    }
    const cmd = msgText.slice(0, colonIndex).trim();
    const rest = msgText.slice(colonIndex + 1).trim();
    command[0] = cmd;
    command[1] = rest;
    return command;
}
