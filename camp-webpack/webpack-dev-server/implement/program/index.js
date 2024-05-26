const { program } = require("commander");

class WebpackCLI {
  constructor() {
    this.program = program;
    this.program.name("webpack");
  }

  async run(args, parseOptions) {
    // Built-in internal commands
    const buildCommandOptions = {
      name: "build [entries...]",
      alias: ["bundle", "b"],
      description: "Run webpack (default command, can be omitted).",
      usage: "[entries...] [options]",
      dependencies: ["webpack"],
    };
    // Built-in external commands
    const externalBuiltInCommandsInfo = [
      {
        name: "serve [entries...]",
        alias: ["server", "s"],
        pkg: "@webpack-cli/serve",
      },
    ];
    const knownCommands = [buildCommandOptions, ...externalBuiltInCommandsInfo];
    const isKnownCommand = (name) =>
      knownCommands.find(
        (command) =>
          getCommandName(command.name) === name ||
          (Array.isArray(command.alias)
            ? command.alias.includes(name)
            : command.alias === name)
      );

    // 由于这个 action 没有关联任何命令
    // 当 parseAsync 解析之后得到的命令没有找到对应的 action（又或者解析之后发现命令为空）时
    // 该 action 将被触发
    this.program.action(async (options, program) => {
      // 解析出没有被处理的具体指令
      const { operands, unknown } = this.program.parseOptions(program.args);
      const hasOperand = typeof operands[0] !== "undefined";
      // 如果没有命令，则默认执行 build 命令
      const operand = hasOperand ? operands[0] : "build";
      let commandToRun = operand;
      // 如果这个命令是 webpack 内置命令，那么就通过 loadCommandByName 去注册这个命令对应的 action
      if (isKnownCommand(commandToRun)) {
        await loadCommandByName(commandToRun, true);
      }
      // 触发 loadCommandByName 注册的 action
      await this.program.parseAsync(
        [commandToRun, ...commandOperands, ...unknown],
        {
          from: "user",
        }
      );
    });
    // 解析命令行参数，并根据解析得到的命令自动触发之前注册到指令上的 action
    await this.program.parseAsync(args, parseOptions);
  }
}

new WebpackCLI().run(process.argv);
