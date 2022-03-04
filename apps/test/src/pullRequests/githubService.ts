import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class GithubService {
  verifySignature(payload: string, webhookSig: string): boolean {
    if (!webhookSig) {
      console.error('missing signature');
      return false;
    }

    const hmacAlg = crypto.createHmac('sha1', 'secret');
    const computedSignature = `sha1=${hmacAlg.update(payload).digest('hex')}`;
    const result = crypto.timingSafeEqual(
      Buffer.from(webhookSig),
      Buffer.from(computedSignature),
    );

    if (!result) {
      console.error('invalid signature');
    }

    return result;
  }
}
