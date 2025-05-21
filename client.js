const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { DateTime } = require("luxon");

const PROTO_PATH = path.resolve(__dirname, 'redesocial.proto');

class LamportClock {
  constructor() {
    this.time = 0;
  }
  tick() {
    this.time++;
    return this.time;
  }
  update(received) {
    this.time = Math.max(this.time, parseInt(received)) + 1;
    return this.time;
  }
}

class SocialMediaClient {
    constructor() {
        this.packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true
        });

        this.protoDescriptor = grpc.loadPackageDefinition(this.packageDefinition);
        this.client = null;
        this.serverAddress = null;
        this.username = null;
        this.clock = new LamportClock();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    log(text) {
        fs.appendFileSync('cliente_node.log', `[${new Date().toISOString()}] ${text}\n`);
    }

    async connectToAvailableServer() {
        const ports = [50051, 50052, 50053];
        
        for (const port of ports) {
            const address = `localhost:${port}`;
            console.log(`Tentando conectar ao servidor em ${address}...`);
            
            try {
                const client = new this.protoDescriptor.socialnetwork.SocialNetwork(
                    address,
                    grpc.credentials.createInsecure()
                );
                
                await new Promise((resolve, reject) => {
                    client.SyncTime({
                        serverId: 'client',
                        localTime: Math.floor(Date.now() / 1000)
                    }, (error, response) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(response);
                        }
                    });
                });
                
                this.client = client;
                this.serverAddress = address;
                console.log(`Conectado ao servidor em ${address}`);
                return true;
            } catch (error) {
                console.log(`Não foi possível conectar ao servidor em ${address}: ${error.message}`);
                continue;
            }
        }
        
        throw new Error('Não foi possível conectar a nenhum servidor disponível');
    }

    async startNotificationListener() {
        while (true) {
            try {
                const request = { user: this.username };
                const call = this.client.SubscribeToUpdates(request);

                call.on('data', (notification) => {
                    console.log(`\n[Notification] ${notification.user}: ${notification.content} (${formatTimestamp(notification.timestamp)})`);
                    this.log(`Notificação de ${notification.user}: ${notification.content}`);
                });

                call.on('error', async (error) => {
                    console.error('Erro no stream de notificações:', error);
                    if (await this.connectToAvailableServer()) {
                        this.startNotificationListener();
                    }
                });

                call.on('end', () => {
                    console.log('Stream de notificações encerrado');
                });
                
                break;
            } catch (error) {
                console.error('Erro ao iniciar listener de notificações:', error);
                if (!(await this.connectToAvailableServer())) {
                    return;
                }
            }
        }
    }

    async createPost(content) {
        try {
            const ts = this.clock.tick();
            const post = {
                user: this.username,
                content: content,
                timestamp: ts
            };

            return await new Promise((resolve, reject) => {
                this.client.CreatePost(post, (error, response) => {
                    if (error) {
                        reject(error);
                    } else {
                        console.log('Postagem enviada:', response.message);
                        this.log(`Post: ${content}`);
                        resolve(response);
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao criar post:', error);
            if (await this.connectToAvailableServer()) {
                return this.createPost(content);
            }
        }
    }

    async sendDirectMessage(recipient, message) {
        try {
            const ts = this.clock.tick();
            const msg = {
                sender: this.username,
                receiver: recipient,
                message: message,
                timestamp: ts
            };

            return await new Promise((resolve, reject) => {
                this.client.SendDirectMessage(msg, (error, response) => {
                    if (error) {
                        reject(error);
                    } else {
                        console.log('Mensagem enviada:', response.message);
                        this.log(`Mensagem para ${recipient}: ${message}`);
                        resolve(response);
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            if (await this.connectToAvailableServer()) {
                return this.sendDirectMessage(recipient, message);
            }
        }
    }

    async followUser(target) {
        try {
            const request = {
                follower: this.username,
                followee: target
            };

            return await new Promise((resolve, reject) => {
                this.client.ConnectUsers(request, (error, response) => {
                    if (error) {
                        reject(error);
                    } else {
                        console.log('Agora você segue:', target);
                        this.log(`Seguindo ${target}`);
                        resolve(response);
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao seguir usuário:', error);
            if (await this.connectToAvailableServer()) {
                return this.followUser(target);
            }
        }
    }

    displayMenu() {
        console.log('\n1 - Post');
        console.log('2 - Private Message');
        console.log('3 - Follow User');
        console.log('0 - Exit');
    }

    question(query) {
        return new Promise((resolve) => this.rl.question(query, resolve));
    }

    async run() {
        try {
            await this.connectToAvailableServer();
            
            this.username = await this.question('Digite seu nome de usuário: ');
            console.log(`Bem-vindo, ${this.username}!`);
            this.log(`Login como ${this.username}`);

            await this.startNotificationListener();

            while (true) {
                this.displayMenu();
                const opt = await this.question('Escolha uma opção: ');

                switch (opt) {
                    case '1':
                        const content = await this.question('Digite o conteúdo da postagem: ');
                        await this.createPost(content);
                        break;
                    case '2':
                        const recipient = await this.question('Para quem deseja enviar a mensagem: ');
                        const message = await this.question('Digite a mensagem: ');
                        await this.sendDirectMessage(recipient, message);
                        break;
                    case '3':
                        const target = await this.question('Digite o nome do usuário a seguir: ');
                        await this.followUser(target);
                        break;
                    case '0':
                        console.log('Encerrando...');
                        this.log('Encerrando cliente');
                        this.rl.close();
                        return;
                    default:
                        console.log('Opção inválida.');
                }
            }
        } catch (error) {
            console.error('Erro fatal:', error);
            this.rl.close();
        }
    }
}

function formatTimestamp(ts) {
    return DateTime.fromSeconds(Number(ts), { zone: "America/Sao_Paulo" }).toFormat("dd/MM/yyyy HH:mm:ss ZZZZ");
}

const client = new SocialMediaClient();
client.run();