import { Size } from "cc";

export type ExtSlotConfig = {
    GAME_ID: string,
    normalItemPath: string,
    blurItemPath: string,
    bgItemPath: string,
    symbolSize: Size,
    symbolCodes: string[],
    symbolCodesFree: string[],
    wildSymbolCode: string,
    scatterSymbolCode: string,
    jackpotSymbolCode: string,
    reelSpinningTime: number, //seconds
    reelSpinningTimeNearWin: number, //seconds
    spinRowsPerSecond: number,
    numberWinScatter: number,
    isTurboMode: boolean,
    curBetAmount: number,
    totalCredit: number,
    isUnitTest: boolean,
}

export const SlotText = {
    NO_MONEY: 'Số dư trong ví không đủ,\nvui lòng nạp thêm để chơi tiếp.',
    LOST_CONNECT: 'Bạn đã bị mất kết nối. \n Vui lòng chờ ...',
    SPIN_4_EVER: 'Bạn đã mất kết nối. \n Vui lòng thử lại.',
    ANOTHER_ACCOUNT: 'Tài khoản của bạn đã\nđăng nhập từ thiết bị khác.',
    AUTHEN_FAILED: 'Xác thực tài khoản thất bại.',
    DEPOSIT_MONEY: 'Số dư không đủ,\nbạn có muốn nạp thêm ?',
    DEPOSIT_MONEY_EVENT: 'Số dư [wallet] không đủ,\nbạn có muốn nạp thêm ?',
    MISMATCH_DATA: 'Dữ liệu không đồng bộ với máy chủ,\nvui lòng thử lại.',
    SYSTEM_ERROR: 'Có lỗi xảy ra,\nvui lòng thử lại.',
    DISCONNECT: 'Bị mất kết nối tới máy chủ\n Đang kết nối lại.',
    NO_PLAYSESSION: 'Hệ thống không tìm thấy phiên chơi.',
    GROUP_MAINTAIN: 'Hệ thống đang bảo trì.\nVui lòng quay lại sau.',
    NETWORK_WARNING: 'Đường truyền mạng yếu!',
    NETWORK_DISCONNECT: 'Bị mất kết nối tới máy chủ \nĐang kết nối lại.',
    NO_FREESPIN_OPTION: 'Dữ liệu không đồng bộ với máy chủ, vui lòng thử lại.',
    IN_PROGRESSING: 'Mạng chậm vui lòng đợi trong \ngiây lát để hoàn thành\nlượt quay hoặc bấm xác nhận \nđể tải lại game.',
    SPIN_UNSUCCESS: 'Thao tác không thành công,\nvui lòng thử lại.',
    ACCOUNT_BLOCKED: 'Tài khoản của bạn đã bị khoá,\nvui lòng liên hệ admin.',
    EVENT_NOT_AVAILABLE: 'Sự kiện không hợp lệ,\nvui lòng thử lại.',
}