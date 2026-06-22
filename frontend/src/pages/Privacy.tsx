/** Política de Privacidade (página pública). */
import { LegalLayout } from './LegalLayout';

export function Privacy() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      subtitle="Como tratamos seus dados na SkillEx."
      sections={[
        {
          title: 'Introdução',
          body: (
            <p>
              Esta Política de Privacidade descreve como a SkillEx coleta, utiliza e protege as
              informações dos usuários da plataforma. Ao utilizar a SkillEx, você concorda com as
              práticas descritas neste documento.
            </p>
          ),
        },
        {
          title: 'Dados que coletamos',
          body: (
            <>
              <p>Coletamos as seguintes informações fornecidas por você:</p>
              <ul>
                <li>
                  <strong>Dados de cadastro:</strong> nome, e-mail e senha (armazenada de forma
                  criptografada).
                </li>
                <li>
                  <strong>Dados de perfil:</strong> foto, biografia, cidade/estado, gênero, data de
                  nascimento, nacionalidade, idiomas e disponibilidade.
                </li>
                <li>
                  <strong>Habilidades:</strong> aquelas que você sabe ensinar e as que deseja
                  aprender.
                </li>
                <li>
                  <strong>Atividade:</strong> solicitações de troca, mensagens, avaliações e
                  transações de moedas internas.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'Como usamos os dados',
          body: (
            <>
              <p>Utilizamos seus dados para:</p>
              <ul>
                <li>Permitir o funcionamento da plataforma e a criação do seu perfil;</li>
                <li>Calcular a compatibilidade (match) entre usuários;</li>
                <li>Exibir você no feed e nos resultados de busca de outros usuários;</li>
                <li>Viabilizar solicitações de troca, aulas, chat e avaliações;</li>
                <li>Gerenciar o saldo e o histórico de moedas internas.</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Compartilhamento de informações',
          body: (
            <p>
              Parte do seu perfil (nome, foto, biografia, habilidades, cidade e avaliações) é{' '}
              <strong>pública</strong> para outros usuários, pois é essencial para a troca de
              habilidades. Não vendemos seus dados pessoais a terceiros. Dados sensíveis como sua
              senha nunca são compartilhados.
            </p>
          ),
        },
        {
          title: 'Cookies e armazenamento local',
          body: (
            <p>
              Utilizamos o armazenamento local do navegador (<em>localStorage</em>) para manter sua
              sessão autenticada (token JWT) e suas preferências, como o tema claro ou escuro. Esses
              dados ficam apenas no seu dispositivo.
            </p>
          ),
        },
        {
          title: 'Segurança',
          body: (
            <p>
              Adotamos boas práticas de segurança, incluindo criptografia de senhas (hash com
              bcrypt), autenticação por token JWT, validação de dados de entrada e proteção contra
              injeção de SQL. Ainda assim, nenhum sistema é 100% imune a riscos.
            </p>
          ),
        },
        {
          title: 'Seus direitos',
          body: (
            <>
              <p>Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você pode:</p>
              <ul>
                <li>Acessar e atualizar seus dados a qualquer momento na área de perfil;</li>
                <li>Corrigir informações incompletas ou desatualizadas;</li>
                <li>Solicitar a exclusão da sua conta e dos dados associados.</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Retenção de dados',
          body: (
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Ao solicitar a exclusão, os
              dados associados à sua conta são removidos, ressalvadas informações que precisem ser
              mantidas por obrigação legal.
            </p>
          ),
        },
        {
          title: 'Alterações nesta política',
          body: (
            <p>
              Esta política pode ser atualizada periodicamente. Alterações relevantes serão
              comunicadas na plataforma, e a data da última atualização será revisada no topo deste
              documento.
            </p>
          ),
        },
        {
          title: 'Contato',
          body: (
            <p>
              Em caso de dúvidas sobre esta Política de Privacidade, entre em contato pelo e-mail{' '}
              <a href="mailto:contato@skillex.com">contato@skillex.com</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
