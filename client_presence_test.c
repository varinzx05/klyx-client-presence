#include <windows.h>
#include <wchar.h>
#include "../Client/src/client_presence.h"

static EspFrame frame;

int wmain(void){
    wchar_t config[MAX_PATH]={0};
    GetTempPathW(MAX_PATH,config);
    wcscat_s(config,MAX_PATH,L"klyx-presence-test.ini");
    if(!WritePrivateProfileStringW(L"Presence",L"Url",L"http://127.0.0.1:8787",config))return 1;
    frame.connected=frame.tabRosterValid=1;
    frame.tabRosterCount=2;
    wcscpy_s(frame.localNametag.text,NAMETAG_LENGTH,L"Alice");
    frame.localNametag.length=5;
    wcscpy_s(frame.tabRoster[0].name.text,NAMETAG_LENGTH,L"Alice");
    frame.tabRoster[0].name.length=5;
    frame.tabRoster[0].xuid=12345678901ull;
    wcscpy_s(frame.tabRoster[1].name.text,NAMETAG_LENGTH,L"Bob");
    frame.tabRoster[1].name.length=3;
    frame.tabRoster[1].xuid=98765432109ull;
    Nametag remote={0};
    wcscpy_s(remote.text,NAMETAG_LENGTH,L"[VIP] Bob");
    remote.length=9;
    if(client_presence_xuid_for_name(&frame,&remote)!=frame.tabRoster[1].xuid)return 3;
    client_presence_start(config);
    client_presence_publish(&frame);
    int self=client_presence_has_badge(frame.tabRoster[0].xuid);
    Sleep(2500);
    int peer=client_presence_has_badge(frame.tabRoster[1].xuid);
    client_presence_stop();
    DeleteFileW(config);
    return self&&peer?0:2;
}
