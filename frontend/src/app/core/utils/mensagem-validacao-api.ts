import { HttpErrorResponse } from '@angular/common/http';

export function mensagemValidacaoApi(erro: unknown): string | undefined {
  if (!(erro instanceof HttpErrorResponse) || ![400, 409, 422].includes(erro.status)) {
    return undefined;
  }
  const erros = erro.error?.errors;
  if (Array.isArray(erros)) {
    const mensagens = erros.filter((mensagem): mensagem is string =>
      typeof mensagem === 'string' && mensagem.trim().length > 0
    );
    if (mensagens.length > 0) return mensagens.join(' ');
  }
  if (typeof erro.error?.message === 'string' && erro.error.message.trim()) {
    return erro.error.message;
  }
  return undefined;
}
