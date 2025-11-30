# Substack Notes Composer (Chrome Extension)

Uma extensão do Google Chrome para facilitar a criação, agendamento e publicação de Notes no Substack diretamente do navegador.

## 🚀 Funcionalidades

- **Editor Simples:** Interface limpa para escrever seus Notes.
- **Agendamento:** Escolha uma data e hora para publicar (o post é salvo como Rascunho agendado).
- **Publicação Direta:** Envia o conteúdo diretamente para a API do Substack.
- **Feedback Visual:** Mensagens claras de sucesso ou erro (ex: falha de autenticação).
- **Segurança:** Utiliza os cookies da sessão ativa do navegador para autenticação (requer login no Substack).

## 🛠️ Instalação (Modo Desenvolvedor)

1. Clone este repositório ou baixe os arquivos.
2. Abra o Google Chrome e acesse `chrome://extensions/`.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** (Load unpacked).
5. Selecione a pasta raiz deste projeto.
6. A extensão aparecerá na sua barra de ferramentas.

## 📦 Estrutura do Projeto

- **manifest.json:** Configuração da extensão (Manifest V3).
- **popup.html / App.tsx:** Interface do usuário (React + Tailwind).
- **background.js:** Service Worker que gerencia as requisições de rede para evitar problemas de CORS.
- **constants.js:** Configurações e URLs da API.

## ⚠️ Requisitos

- Você deve estar logado no [Substack.com](https://substack.com) no navegador Chrome para que a extensão funcione, pois ela utiliza sua sessão ativa para autenticar as requisições.

## 🤝 Contribuição

1. Faça um Fork do projeto.
2. Crie uma Branch para sua Feature (`git checkout -b feature/MinhaFeature`).
3. Faça o Commit das suas mudanças (`git commit -m 'Adiciona MinhaFeature'`).
4. Faça o Push para a Branch (`git push origin feature/MinhaFeature`).
5. Abra um Pull Request.

## 📄 Licença

Este projeto está sob a licença MIT.