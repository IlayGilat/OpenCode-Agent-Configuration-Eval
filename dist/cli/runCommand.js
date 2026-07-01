export async function runCommand(command) {
    try {
        await command();
    }
    catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}
