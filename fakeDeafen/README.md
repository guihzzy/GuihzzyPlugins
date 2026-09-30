# Plugin FakeDeafen

## 📝 Descrição
O **FakeDeafen** permite que você controle com precisão como o seu estado de áudio é visto pelos outros usuários no Discord, interceptando os pacotes do Gateway (Voice State Update - OP 4) diretamente antes do envio ao servidor. 

Você pode aparentar estar **ensurdecido**, **mutado**, com **ambos ativos** ou até **completamente invisível/ativo**, enquanto **localmente você continua ouvindo e falando normalmente**.

---

## ✨ Funcionalidades

- 🎧 **Múltiplos Modos de Exibição:**
  - **Apenas Ensurdecido:** O servidor registra `self_deaf: true` (mostra o fone cortado).
  - **Apenas Mutado:** O servidor registra `self_mute: true` (mostra o microfone cortado).
  - **Mutado e Ensurdecido:** O servidor registra ambos como `true` e injeta os dois ícones cortados (🎙️🚫 + 🎧🚫) na interface do canal de voz.
  - **Normal / Invisível:** Envia ambos como `false`, parecendo totalmente ativo sem nenhum ícone de mudo.
- 🔊 **Áudio e Microfone 100% Funcionais:** Seu áudio local nunca é desativado — você escuta todas as conversas e pode falar à vontade em qualquer um dos modos.
- 🔔 **Notificações em Card (Toasts):** Feedback visual instantâneo e moderno no canto inferior direito quando o plugin é ativado ou desativado, informando o modo e o estado atual.
- 🔌 **Gateway Socket Hook:** Interceptação segura e estável via wrapper interno do Gateway do Discord, sem conflitar com outros mods de áudio.
- 🎛️ **Botão Rápido no Painel de Usuário:** Ícone dedicado no rodapé ao lado do seu microfone e fone para ligar/desligar com 1 clique e feedback visual da cor do estado.

---

## ⚙️ Opções Disponíveis

Nas configurações do plugin, selecione a opção desejada em **Icon Mode**:
1. **Apenas Ensurdecido (Aparece com fone cortado)**
2. **Apenas Mutado (Aparece com microfone cortado)**
3. **Mutado e Ensurdecido (Aparece com fone e microfone cortados)**
4. **Normal / Invisível (Aparece totalmente ativo, sem nenhum ícone)**

---

<p align="center">Feito com ❤️ por <b>Guih</b></p>
