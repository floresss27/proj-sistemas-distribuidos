# Rede Social com Publicações e Troca de Mensagens

Desenvolver um sistema distribuído para uma rede social que permita a interação entre usuários, incluindo a publicação de textos, troca de mensagens e funcionalidades de notificação, usando múltiplos servidores para garantir alta disponibilidade e consistência. O sistema deve utilizar algoritmos de sincronização de relógios e garantir a ordenação das mensagens através de relógios lógicos.

Os usuários:
- Um usuário pode publicar textos que ficam visíveis para outros usuários. Cada publicação deve ser associada ao usuário que a postou e registrada com um timestamp;
- Usuários podem seguir outros usuários. Ao seguir alguém, o usuário recebe notificações quando este usuário publica uma nova mensagem;
- Os usuários podem enviar mensagens privadas uns aos outros. As mensagens devem ser entregues de forma confiável e ordenada;

Os servidores:
- As mensagens e postagens devem ser replicadas em pelo menos três servidores. A adição e remoção de servidores devem ser feitas de forma dinâmica, sem comprometer a disponibilidade e a integridade das mensagens;
- O sistema deve garantir que os relógios dos servidores estejam sincronizados. Para isso, o algoritmo de Berkeley será utilizado, com eleição de um coordenador via bullying. O coordenador será responsável por atualizar os relógios dos servidores participantes.

O sistema implementado:
- Cada processo (usuário ou servidor) deve manter um relógio lógico. As mensagens publicadas pelos usuários e as interações entre eles (como mensagens privadas) devem ser ordenadas de acordo com o relógio lógico de cada processo, garantindo consistência na ordem de leitura e entrega das mensagens;
- Todos os processos (usuário ou servidor) deve gerar um arquivo log com todas as interações que ocorrerem (postagens, mensagens, sincronização de relógio, etc.)

## Desenvolvimento do projeto:
- O projeto deve ser desenvolvido usando qualquer biblioteca de comunicação (e.g., ZeroMQ, gRPC, OpenMPI) e com pelo menos 3 linguagens diferentes (e.g., Python, Java, C, C++, JavaScript ou TypeScript, Go, Rust, Zig, Elixir, Gleam, Erlang...);
- Os processos que postam e/ou enviam mensagens podem ser controlados pelos usuários ou fazer postagens/troca de mensagens de forma automática;
- O projeto deve executar pelo menos 3 servidores e 5 usuários para testar;
- Para garantir que a sincronização dos relógios está funcionando, os relógios de todos os processos podem sofrer alterações na atualização deles de forma aleatória podendo ser adiantados ou atrasados em até 1 segundo;
- A documentação do projeto deve conter:
    - Descrição do padrão de mensagem utilizado em todas as partes do projeto
    - Descrição dos dados enviados nas mensagens
    - Diagrama mostrando a relação entre os serviços implementados