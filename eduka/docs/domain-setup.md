# Eduka Domain/Subdomain Setup

## Wildcard subdomain
Har bir o'quv markaz uchun `markaz.eduka.uz` ishlashi uchun Cloudflare'da wildcard record kerak.

Cloudflare DNS:
```text
Type: CNAME
Name: *
Target: Railway provided domain
Proxy: Railway talabiga qarab ON/OFF
```

## Custom domain
Premium markazlar uchun:
```text
crm.markaz.uz -> cname.eduka.uz
```

## Tekshirish
- Domain `organization_domains` jadvalida bor
- DNS status: verified
- SSL status: issued/active
- Host-based tenant resolve ishlaydi

## Muammo bo'lsa
- Cloudflare DNS propagation kuting
- Railway custom domain statusini tekshiring
- SSL sertifikat statusini tekshiring
